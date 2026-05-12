import { useCallback, useEffect, useRef, useState } from 'react'
import { MetronomeEngine } from '@renderer/audio/MetronomeEngine'
import { getAudioContext } from '@renderer/audio/AudioContextManager'
import { useLooperStore } from '@renderer/store/looperStore'

// Module-level singleton so all components share one engine
let engine: MetronomeEngine | null = null

function getEngine(bpm: number, beats: number): MetronomeEngine {
  if (!engine) engine = new MetronomeEngine(getAudioContext(), bpm, beats)
  return engine
}

export function useMetronome() {
  const { bpm, timeSignature, setMetronomeRunning } = useLooperStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeBeat, setActiveBeat] = useState(-1)
  const ref = useRef(getEngine(bpm, timeSignature.beats))

  useEffect(() => { ref.current.setBpm(bpm) }, [bpm])
  useEffect(() => { ref.current.setBeatsPerBar(timeSignature.beats) }, [timeSignature.beats])

  useEffect(() => ref.current.onBeat((beat) => setActiveBeat(beat)), [])

  const toggle = useCallback(() => {
    const e = ref.current
    if (e.isRunning) {
      e.stop()
      setIsPlaying(false)
      setActiveBeat(-1)
      setMetronomeRunning(false)
    } else {
      e.start()
      setIsPlaying(true)
      setMetronomeRunning(true)
    }
  }, [setMetronomeRunning])

  return { isPlaying, activeBeat, toggle, engine: ref.current }
}
