import { useEffect, useMemo, useRef, useState } from 'react'

function padFrame(num) {
  return String(num).padStart(3, '0')
}

export default function MilkPourSlider({
  framesPath = '/milk-pour-frames',
  frameCount = 60,
  startFrame = 1,
  framePrefix = 'frame_',
  extension = 'png',
}) {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const drawRafRef = useRef(null)
  const [slider, setSlider] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [hasError, setHasError] = useState(false)

  const frameIndex = useMemo(() => {
    const t = Math.max(0, Math.min(100, Number(slider) || 0))
    const idx = Math.round((t / 100) * (frameCount - 1))
    return idx
  }, [slider, frameCount])

  useEffect(() => {
    let cancelled = false
    imagesRef.current = new Array(frameCount)
    setLoadedCount(0)
    setHasError(false)

    for (let i = 0; i < frameCount; i += 1) {
      const frameNumber = startFrame + i
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        imagesRef.current[i] = img
        setLoadedCount((c) => c + 1)
      }
      img.onerror = () => {
        if (cancelled) return
        setHasError(true)
      }
      img.src = `${framesPath}/${framePrefix}${padFrame(frameNumber)}.${extension}`
    }

    return () => {
      cancelled = true
      if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
    }
  }, [extension, frameCount, framePrefix, framesPath, startFrame])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const img = imagesRef.current[frameIndex]
      if (!img) return

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

      const scale = Math.min(width / img.width, height / img.height)
      const renderW = img.width * scale
      const renderH = img.height * scale
      const x = (width - renderW) / 2
      const y = (height - renderH) / 2
      ctx.drawImage(img, x, y, renderW, renderH)
    }

    if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current)
    drawRafRef.current = requestAnimationFrame(draw)
  }, [frameIndex, loadedCount])

  const isReady = loadedCount === frameCount && !hasError

  return (
    <div className="milk-pour-shell">
      <div className="milk-pour-canvas-wrap">
        <canvas ref={canvasRef} className="milk-pour-canvas" />
        {!isReady ? (
          <div className="milk-pour-overlay">
            {hasError
              ? `Frames not found in ${framesPath}. Expected ${framePrefix}${padFrame(startFrame)}.${extension} ... ${framePrefix}${padFrame(startFrame + frameCount - 1)}.${extension}`
              : `Loading frames... ${loadedCount}/${frameCount}`}
          </div>
        ) : null}
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
