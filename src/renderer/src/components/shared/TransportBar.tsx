import { useCallback, useRef } from 'react'
import { useMetronome } from '@renderer/hooks/useMetronome'
import { useLooperStore } from '@renderer/store/looperStore'

export function TransportBar() {
  const { bpm, setBpm, timeSignature, setTimeSignature } = useLooperStore()
  const { isPlaying, activeBeat, toggle } = useMetronome()
  const tapTimesRef = useRef<number[]>([])

  const handleTap = useCallback(() => {
    const now = Date.now()
    const taps = tapTimesRef.current
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) tapTimesRef.current = []
    tapTimesRef.current.push(now)
    if (tapTimesRef.current.length > 8) tapTimesRef.current.shift()
    if (tapTimesRef.current.length >= 2) {
      const intervals = tapTimesRef.current.slice(1).map((t, i) => t - tapTimesRef.current[i])
      setBpm(Math.max(20, Math.min(300, Math.round(60000 / (intervals.reduce((a, b) => a + b) / intervals.length)))))
    }
  }, [setBpm])

  return (
    <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-800 bg-gray-950 shrink-0">
      {/* Beat dots */}
      <div className="flex gap-1.5 shrink-0">
        {Array.from({ length: timeSignature.beats }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-75 ${
              activeBeat === i ? (i === 0 ? 'bg-white' : 'bg-indigo-400') : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* BPM */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => setBpm(Math.max(20, bpm - 1))} className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold flex items-center justify-center">−</button>
        <div className="w-16 text-center">
          <span className="text-xl font-mono font-bold tabular-nums">{bpm}</span>
          <span className="text-xs text-gray-500 ml-1">bpm</span>
        </div>
        <button onClick={() => setBpm(Math.min(300, bpm + 1))} className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold flex items-center justify-center">+</button>
      </div>

      {/* Slider */}
      <input
        type="range" min={20} max={300} value={bpm}
        onChange={e => setBpm(Number(e.target.value))}
        className="w-28 accent-indigo-500"
      />

      {/* Time signature */}
      <select
        value={`${timeSignature.beats}/${timeSignature.noteValue}`}
        onChange={e => { const [b, n] = e.target.value.split('/').map(Number); setTimeSignature(b, n) }}
        className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 outline-none cursor-pointer"
      >
        {['2/4','3/4','4/4','5/4','6/8','7/8'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Start / Tap */}
      <button
        onClick={toggle}
        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>
      <button
        onPointerDown={handleTap}
        className="px-4 py-1.5 rounded text-sm font-medium bg-gray-800 hover:bg-gray-700 select-none"
      >
        Tap
      </button>
    </div>
  )
}
