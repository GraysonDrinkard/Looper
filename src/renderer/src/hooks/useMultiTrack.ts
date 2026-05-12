import { useCallback, useRef, useState } from 'react'
import { LoopEngine, LoopState } from '@renderer/audio/LoopEngine'
import { getMasterGain } from '@renderer/audio/MasterBus'
import { encodeWav } from '@renderer/audio/wavEncoder'

export interface Track {
  id: string
  state: LoopState
  volume: number
  muted: boolean
  soloed: boolean
  trimStart: number
  trimEnd: number
  buffer: AudioBuffer | null
}

function effectiveVolume(track: Track, all: Track[]): number {
  if (track.muted) return 0
  const anySoloed = all.some(t => t.soloed)
  if (anySoloed && !track.soloed) return 0
  return track.volume
}

export function useMultiTrack() {
  const engines = useRef<Record<string, LoopEngine>>({})
  const [tracks, setTracks] = useState<Track[]>([])

  const update = useCallback((id: string, patch: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const reapplyVolumes = useCallback((nextTracks: Track[]) => {
    nextTracks.forEach(t => engines.current[t.id]?.setVolume(effectiveVolume(t, nextTracks)))
  }, [])

  const addTrack = useCallback(() => {
    const id = crypto.randomUUID()
    const engine = new LoopEngine(getMasterGain())
    engines.current[id] = engine

    engine.onStateChange((state) => {
      setTracks(prev => prev.map(t => {
        if (t.id !== id) return t
        const buf = engine.buffer
        // Auto-init trim end when recording finishes for the first time
        const trimEnd = state === 'stopped' && buf && t.trimEnd === 0 ? buf.duration : t.trimEnd
        if (state === 'stopped' && buf && t.trimEnd === 0) engine.setTrimPoints(0, buf.duration)
        return { ...t, state, buffer: buf, trimEnd }
      }))
    })

    setTracks(prev => [...prev, {
      id, state: 'idle', volume: 1, muted: false, soloed: false,
      trimStart: 0, trimEnd: 0, buffer: null,
    }])
  }, [])

  const removeTrack = useCallback((id: string) => {
    engines.current[id]?.dispose()
    delete engines.current[id]
    setTracks(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleRecord = useCallback(async (id: string) => {
    const engine = engines.current[id]
    if (!engine) return
    if (engine.state === 'recording') {
      await engine.stopRecording()
    } else {
      try { await engine.startRecording() }
      catch { alert('Could not access microphone. Please allow microphone access and try again.') }
    }
  }, [])

  const togglePlay = useCallback((id: string) => {
    const engine = engines.current[id]
    if (!engine) return
    if (engine.state === 'playing') engine.stop()
    else if (engine.hasBuffer) engine.play()
  }, [])

  const setVolume = useCallback((id: string, volume: number) => {
    setTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, volume } : t)
      reapplyVolumes(next)
      return next
    })
  }, [reapplyVolumes])

  const setMuted = useCallback((id: string, muted: boolean) => {
    setTracks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, muted } : t)
      reapplyVolumes(next)
      return next
    })
  }, [reapplyVolumes])

  const setSoloed = useCallback((id: string, soloed: boolean) => {
    setTracks(prev => {
      // Only one track can be soloed at a time; toggle off if clicking the same one
      const next = prev.map(t => ({ ...t, soloed: t.id === id ? soloed : false }))
      reapplyVolumes(next)
      return next
    })
  }, [reapplyVolumes])

  const setTrim = useCallback((id: string, trimStart: number, trimEnd: number) => {
    engines.current[id]?.setTrimPoints(trimStart, trimEnd)
    update(id, { trimStart, trimEnd })
  }, [update])

  const seekTrack = useCallback((id: string) => {
    engines.current[id]?.seekToTrimStart()
  }, [])

  const clearTrack = useCallback((id: string) => {
    engines.current[id]?.clear()
    update(id, { buffer: null, trimStart: 0, trimEnd: 0 })
  }, [update])

  const downloadTrack = useCallback(async (id: string, name: string) => {
    const track = tracks.find(t => t.id === id)
    if (!track?.buffer) return
    const wav = encodeWav(track.buffer, track.trimStart, track.trimEnd || track.buffer.duration)
    await window.electronAPI.saveFile(wav, `${name}.wav`)
  }, [tracks])

  const uploadTrack = useCallback((id: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const arrayBuf = await file.arrayBuffer()
      const ctx = getMasterGain().context as AudioContext
      try {
        const decoded = await ctx.decodeAudioData(arrayBuf)
        engines.current[id]?.loadBuffer(decoded)
        update(id, { buffer: decoded, trimStart: 0, trimEnd: decoded.duration })
        engines.current[id]?.setTrimPoints(0, decoded.duration)
      } catch {
        alert('Could not decode audio file. Try a WAV, MP3, or OGG file.')
      }
    }
    input.click()
  }, [update])

  return { tracks, addTrack, removeTrack, toggleRecord, togglePlay, setVolume, setMuted, setSoloed, setTrim, seekTrack, clearTrack, downloadTrack, uploadTrack }
}
