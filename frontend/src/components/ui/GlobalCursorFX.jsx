import { useEffect, useRef, useState } from 'react'

export default function GlobalCursorFX() {
  const frameRef = useRef(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const activeUntilRef = useRef(0)

  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [moving, setMoving] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateEnabled = () => setEnabled(media.matches && !reduced.matches)
    updateEnabled()

    media.addEventListener('change', updateEnabled)
    reduced.addEventListener('change', updateEnabled)

    return () => {
      media.removeEventListener('change', updateEnabled)
      reduced.removeEventListener('change', updateEnabled)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onMove = (event) => {
      targetRef.current = { x: event.clientX, y: event.clientY }
      activeUntilRef.current = performance.now() + 120
      if (!ready) {
        currentRef.current = { x: event.clientX, y: event.clientY }
        setPosition({ x: event.clientX, y: event.clientY })
        setReady(true)
      }
    }

    const animate = () => {
      const current = currentRef.current
      const target = targetRef.current

      current.x += (target.x - current.x) * 0.14
      current.y += (target.y - current.y) * 0.14
      setPosition({ x: current.x, y: current.y })
      setMoving(performance.now() < activeUntilRef.current)

      frameRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('pointermove', onMove)
    frameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [enabled, ready])

  if (!enabled || !ready) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[3]">
      <div
        className={`cursor-fx-orb ${moving ? 'is-moving' : ''}`}
        style={{ transform: `translate(${position.x - 120}px, ${position.y - 120}px)` }}
      />
      <div
        className={`cursor-fx-dot ${moving ? 'is-moving' : ''}`}
        style={{ transform: `translate(${position.x - 8}px, ${position.y - 8}px)` }}
      />
    </div>
  )
}
