import { useEffect, useRef } from 'react'

interface Props {
  buffer: AudioBuffer
  trimStart: number
  trimEnd: number
  onTrimChange: (start: number, end: number) => void
  onSlideEnd?: () => void
}

const HIT = 12

export function Waveform({ buffer, trimStart, trimEnd, onTrimChange, onSlideEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Refs for all values used inside event handlers — avoids stale closures entirely
  const trimStartRef = useRef(trimStart)
  const trimEndRef = useRef(trimEnd)
  const onTrimChangeRef = useRef(onTrimChange)
  const onSlideEndRef = useRef(onSlideEnd)
  const bufferRef = useRef(buffer)
  useEffect(() => { trimStartRef.current = trimStart }, [trimStart])
  useEffect(() => { trimEndRef.current = trimEnd }, [trimEnd])
  useEffect(() => { onTrimChangeRef.current = onTrimChange }, [onTrimChange])
  useEffect(() => { onSlideEndRef.current = onSlideEnd }, [onSlideEnd])
  useEffect(() => { bufferRef.current = buffer }, [buffer])

  const dragging = useRef<'start' | 'end' | 'region' | null>(null)
  const dragStartX = useRef(0)
  const dragStartTrim = useRef({ start: 0, end: 0 })
  const peaks = useRef<{ min: number; max: number }[]>([])
  const lastPeakWidth = useRef(0)

  // Drawing — reads from refs so it can be called from ResizeObserver too
  const draw = useRef(() => {})
  draw.current = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    if (width === 0 || height === 0) return

    const buf = bufferRef.current
    const ts = trimStartRef.current
    const te = trimEndRef.current

    // Rebuild peaks if width changed or buffer changed
    if (lastPeakWidth.current !== width) {
      lastPeakWidth.current = width
      const data = buf.getChannelData(0)
      const step = Math.max(1, Math.floor(data.length / width))
      peaks.current = Array.from({ length: width }, (_, i) => {
        let min = 1, max = -1
        for (let j = 0; j < step; j++) {
          const s = data[i * step + j] ?? 0
          if (s < min) min = s
          if (s > max) max = s
        }
        return { min, max }
      })
    }

    const sx = Math.round((ts / buf.duration) * width)
    const ex = Math.round((te / buf.duration) * width)
    const mid = height / 2

    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < peaks.current.length; i++) {
      const { min, max } = peaks.current[i]
      ctx.fillStyle = i >= sx && i <= ex ? '#6366f1' : '#1f2937'
      ctx.fillRect(i, mid - max * mid, 1, Math.max(1, (max - min) * mid))
    }

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, sx, height)
    ctx.fillRect(ex, 0, width - ex, height)

    const drawHandle = (x: number) => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(x - 1, 0, 2, height)
      const tabH = 22, tabW = 10, tabY = (height - tabH) / 2
      ctx.beginPath()
      ctx.roundRect(x - tabW / 2, tabY, tabW, tabH, 3)
      ctx.fill()
    }
    drawHandle(sx)
    drawHandle(ex)
  }

  // Redraw whenever props change
  useEffect(() => { draw.current() }, [trimStart, trimEnd, buffer])

  // Keep canvas pixel size in sync with CSS size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      lastPeakWidth.current = 0
      draw.current()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  // All mouse handlers use refs — no closures over props at all
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const timeAt = (clientX: number) => {
      const rect = canvas.getBoundingClientRect()
      return Math.max(0, Math.min(bufferRef.current.duration,
        ((clientX - rect.left) / rect.width) * bufferRef.current.duration))
    }

    const updateCursor = (clientX: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const dur = bufferRef.current.duration
      const sx = (trimStartRef.current / dur) * rect.width
      const ex = (trimEndRef.current / dur) * rect.width
      if (dragging.current === 'region') canvas.style.cursor = 'grabbing'
      else if (Math.abs(x - sx) <= HIT || Math.abs(x - ex) <= HIT) canvas.style.cursor = 'col-resize'
      else if (x > sx && x < ex) canvas.style.cursor = 'grab'
      else canvas.style.cursor = 'default'
    }

    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const dur = bufferRef.current.duration
      const sx = (trimStartRef.current / dur) * rect.width
      const ex = (trimEndRef.current / dur) * rect.width

      if (Math.abs(x - sx) <= HIT) {
        dragging.current = 'start'
      } else if (Math.abs(x - ex) <= HIT) {
        dragging.current = 'end'
      } else if (x > sx && x < ex) {
        dragging.current = 'region'
        dragStartX.current = e.clientX
        dragStartTrim.current = { start: trimStartRef.current, end: trimEndRef.current }
      }
    }

    const onMove = (e: MouseEvent) => {
      updateCursor(e.clientX)
      if (!dragging.current) return
      e.preventDefault()

      const buf = bufferRef.current
      const GAP = 0.05

      if (dragging.current === 'region') {
        const rect = canvas.getBoundingClientRect()
        const dt = ((e.clientX - dragStartX.current) / rect.width) * buf.duration
        const { start, end } = dragStartTrim.current
        const len = end - start
        const newStart = Math.max(0, Math.min(buf.duration - len, start + dt))
        onTrimChangeRef.current(newStart, newStart + len)
      } else if (dragging.current === 'start') {
        const t = timeAt(e.clientX)
        onTrimChangeRef.current(Math.min(t, trimEndRef.current - GAP), trimEndRef.current)
      } else {
        const t = timeAt(e.clientX)
        onTrimChangeRef.current(trimStartRef.current, Math.max(t, trimStartRef.current + GAP))
      }
    }

    const onUp = () => {
      if (dragging.current === 'region') onSlideEndRef.current?.()
      dragging.current = null
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('mouseleave', onUp)
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mouseleave', onUp)
    }
  }, []) // empty deps — handlers read everything from refs

  return <canvas ref={canvasRef} className="w-full h-full" />
}
