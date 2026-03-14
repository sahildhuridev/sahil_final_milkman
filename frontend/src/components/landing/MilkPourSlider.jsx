import { useEffect, useMemo, useRef, useState } from 'react'

function padFrame(num) {
  return String(num).padStart(3, '0')
}

function getFrameSrc(framesPath, framePrefix, frameNumber, extension) {
  return `${framesPath}/${framePrefix}${padFrame(frameNumber)}.${extension}`
}

export default function MilkPourSlider({
  framesPath = '/milk-pour-frames-webp',
  frameCount = 60,
  startFrame = 1,
  framePrefix = 'frame_',
  extension = 'webp',
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const imagePromisesRef = useRef([])
  const drawRafRef = useRef(null)
  const preloadIndexRef = useRef(1)
  const preloadTimerRef = useRef(null)
  const activeLoadsRef = useRef(0)
  const [slider, setSlider] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const frameIndex = useMemo(() => {
    const t = Math.max(0, Math.min(100, Number(slider) || 0))
    return Math.round((t / 100) * (frameCount - 1))
  }, [slider, frameCount])

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    imagesRef.current = new Array(frameCount)
    imagePromisesRef.current = new Array(frameCount)
    preloadIndexRef.current = 1
    activeLoadsRef.current = 0
    setLoadedCount(0)
    setHasError(false)

    const loadFrame = (index, { priority = 'auto' } = {}) => {
      if (cancelled || index < 0 || index >= frameCount) return Promise.resolve(null)
      if (imagesRef.current[index]) return Promise.resolve(imagesRef.current[index])
      if (imagePromisesRef.current[index]) return imagePromisesRef.current[index]

      const frameNumber = startFrame + index
      const img = new Image()

      img.decoding = 'async'
      if ('fetchPriority' in img) {
        img.fetchPriority = priority
      }

      const promise = new Promise((resolve, reject) => {
        img.onload = () => {
          if (cancelled) {
            resolve(null)
            return
          }

          imagesRef.current[index] = img
          setLoadedCount((count) => count + 1)
          resolve(img)
        }

        img.onerror = () => {
          if (!cancelled) {
            setHasError(true)
          }
          reject(new Error(`Failed to load frame ${frameNumber}`))
        }
      }).finally(() => {
        imagePromisesRef.current[index] = null
      })

      imagePromisesRef.current[index] = promise
      img.src = getFrameSrc(framesPath, framePrefix, frameNumber, extension)
      return promise
    }

    const schedule = (callback, delay = 0) => {
      if (cancelled) return
      const requestIdle = window.requestIdleCallback
      if (typeof requestIdle === 'function') {
        preloadTimerRef.current = requestIdle(callback, { timeout: Math.max(120, delay) })
      } else {
        preloadTimerRef.current = window.setTimeout(callback, delay)
      }
    }

    const pumpQueue = () => {
      if (cancelled || !isVisible || hasError) return

      while (activeLoadsRef.current < 2 && preloadIndexRef.current < frameCount) {
        const nextIndex = preloadIndexRef.current
        preloadIndexRef.current += 1
        activeLoadsRef.current += 1

        loadFrame(nextIndex)
          .catch(() => null)
          .finally(() => {
            activeLoadsRef.current -= 1
            schedule(pumpQueue, 60)
          })
      }
    }

    loadFrame(0, { priority: 'high' }).then(() => {
      if (isVisible) {
        schedule(pumpQueue, 80)
      }
    }).catch(() => null)

    return () => {
      cancelled = true
      if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
      if (preloadTimerRef.current) {
        const cancelIdle = window.cancelIdleCallback
        if (typeof cancelIdle === 'function') {
          cancelIdle(preloadTimerRef.current)
        } else {
          clearTimeout(preloadTimerRef.current)
        }
      }
    }
  }, [extension, frameCount, framePrefix, framesPath, hasError, isVisible, startFrame])

  useEffect(() => {
    if (!isVisible || hasError) return
    if (!imagesRef.current[frameIndex]) {
      const currentFrame = startFrame + frameIndex
      const img = new Image()
      img.decoding = 'async'
      if ('fetchPriority' in img) {
        img.fetchPriority = 'high'
      }
      img.src = getFrameSrc(framesPath, framePrefix, currentFrame, extension)
    }
  }, [extension, frameIndex, framePrefix, framesPath, hasError, isVisible, startFrame])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const img = imagesRef.current[frameIndex]
      const displayImg = img || imagesRef.current[0]
      if (!displayImg) return

      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const targetW = Math.floor(width * dpr)
      const targetH = Math.floor(height * dpr)
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW
        canvas.height = targetH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const scale = Math.min(width / displayImg.width, height / displayImg.height)
      const renderW = displayImg.width * scale
      const renderH = displayImg.height * scale
      const x = (width - renderW) / 2
      const y = (height - renderH) / 2
      ctx.drawImage(displayImg, x, y, renderW, renderH)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
      drawRafRef.current = requestAnimationFrame(draw)
    })

    resizeObserver.observe(canvas)
    if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
    drawRafRef.current = requestAnimationFrame(draw)
    return () => {
      resizeObserver.disconnect()
      if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
    }
  }, [frameIndex, loadedCount])

  return (
    <div ref={containerRef} className="milk-pour-shell">
      <div className="milk-pour-canvas-wrap">
        <canvas ref={canvasRef} className="milk-pour-canvas" />
        {loadedCount < frameCount && !hasError ? (
          <div className="milk-pour-loading-status">
            Loading animation... {loadedCount}/{frameCount}
          </div>
        ) : null}
        {hasError && (
          <div className="milk-pour-overlay">
            Animation frames are unavailable right now.
          </div>
        )}
      </div>

      <div className="milk-pour-slider-wrap">
        <input
          type="range"
          min="0"
          max="100"
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
          className="milk-pour-slider"
          aria-label="Milk pour progress"
        />
        <div className="milk-pour-scale">
          <span>Full</span>
          <span>Half</span>
          <span>Start</span>
          <span>Empty</span>
        </div>
      </div>
    </div>
  )
}
