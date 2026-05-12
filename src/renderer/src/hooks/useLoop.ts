import { useCallback, useEffect, useRef, useState } from 'react'
import { LoopEngine, LoopState } from '@renderer/audio/LoopEngine'
import { getMasterGain } from '@renderer/audio/MasterBus'
import { encodeWav } from '@renderer/audio/wavEncoder'

export function useLoop() {
  const engineRef = useRef<LoopEngine | null>(null)
  const [state, setState] = useState<LoopState>('idle')
  const [volume, setVolumeState] = useState(1)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new LoopEngine(getMasterGain())
      engineRef.current.onStateChange(setState)
    }
    return engineRef.current
  }, [])

  const toggleRecord = useCallback(async () => {
    const e = getEngine()
    if (e.state === 'recording') {
      await e.stopRecording()
    } else {
      try {
        await e.startRecording()
      } catch {
        alert('Could not access microphone. Please allow microphone access and try again.')
      }
    }
  }, [getEngine])

  const togglePlay = useCallback(() => {
    const e = getEngine()
    if (e.state === 'playing') {
      e.stop()
    } else if (e.hasBuffer) {
      e.play()
    }
  }, [getEngine])

  const clear = useCallback(() => getEngine().clear(), [getEngine])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    getEngine().setVolume(v)
  }, [getEngine])

  const download = useCallback(async () => {
    const e = getEngine()
    const buf = e.buffer
    if (!buf) return
    const wav = encodeWav(buf, 0, buf.duration)
    await window.electronAPI.saveFile(wav, 'loop.wav')
  }, [getEngine])

  const upload = useCallback(() => {
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
        getEngine().loadBuffer(decoded)
      } catch {
        alert('Could not decode audio file. Try a WAV, MP3, or OGG file.')
      }
    }
    input.click()
  }, [getEngine])

  useEffect(() => () => { engineRef.current?.dispose() }, [])

  return { state, volume, setVolume, toggleRecord, togglePlay, clear, download, upload }
}
