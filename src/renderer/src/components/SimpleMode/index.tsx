import { useCallback, useRef } from 'react'
import { useMetronome } from '@renderer/hooks/useMetronome'
import { useLoop } from '@renderer/hooks/useLoop'
import { useLooperStore } from '@renderer/store/looperStore'

export function SimpleMode() {
  const { bpm, setBpm, timeSignature } = useLooperStore()
  const { isPlaying, activeBeat, toggle: toggleMetronome } = useMetronome()
  const { state: loopState, volume, setVolume, toggleRecord, togglePlay, clear, download, upload } = useLoop()
  const tapTimesRef = useRef<number[]>([])

  const handleTap = useCallback(() => {
    const now = Date.now()
    const taps = tapTimesRef.current
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) tapTimesRef.current = []
    tapTimesRef.current.push(now)
    if (tapTimesRef.current.length > 8) tapTimesRef.current.shift()
    if (tapTimesRef.current.length >= 2) {
      const intervals = tapTimesRef.current.slice(1).map((t, i) => t - tapTimesRef.current[i])
      const avg = intervals.reduce((a, b) => a + b) / intervals.length
      setBpm(Math.max(20, Math.min(300, Math.round(60000 / avg))))
    }
  }, [setBpm])

  const isRecording = loopState === 'recording'
  const isPlayingLoop = loopState === 'playing'
  const hasRecording = loopState !== 'idle'

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">

      {/* ── Metronome ── */}
      <div className="flex flex-col items-center gap-5 w-72">
        {/* Beat dots */}
        <div className="flex gap-3">
          {Array.from({ length: timeSignature.beats }).map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full transition-all duration-75 ${
                activeBeat === i
                  ? i === 0 ? 'bg-white scale-110' : 'bg-indigo-400 scale-105'
                  : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* BPM control */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setBpm(Math.max(20, bpm - 1))}
            className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-xl font-bold text-gray-300 flex items-center justify-center"
          >
            −
          </button>
          <div className="text-center w-28">
            <div className="text-6xl font-mono font-bold tabular-nums leading-none">{bpm}</div>
            <div className="text-xs text-gray-500 tracking-widest uppercase mt-2">bpm</div>
          </div>
          <button
            onClick={() => setBpm(Math.min(300, bpm + 1))}
            className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-xl font-bold text-gray-300 flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* BPM slider */}
        <input
          type="range" min={20} max={300} value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />

        {/* Start / Tap */}
        <div className="flex gap-3 w-full">
          <button
            onClick={toggleMetronome}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-colors ${
              isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
          <button
            onPointerDown={handleTap}
            className="flex-1 py-3 rounded-lg font-medium text-sm bg-gray-800 hover:bg-gray-700 active:bg-gray-600 select-none"
          >
            Tap Tempo
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="w-72 h-px bg-gray-800" />

      {/* ── Loop track ── */}
      <div className="flex flex-col items-center gap-4 w-72">
        <div className="text-xs tracking-widest uppercase text-gray-500">
          {loopState === 'idle' && 'No recording'}
          {loopState === 'recording' && '● Recording…'}
          {loopState === 'playing' && '▶ Playing'}
          {loopState === 'stopped' && 'Stopped'}
        </div>

        <div className="flex gap-2 w-full">
          {/* Record */}
          <button
            onClick={toggleRecord}
            disabled={hasRecording && !isRecording}
            title={hasRecording && !isRecording ? 'Clear before re-recording' : undefined}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 animate-pulse'
                : hasRecording
                  ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
            {isRecording ? 'Stop Rec' : 'Record'}
          </button>

          {/* Play / Stop loop */}
          <button
            onClick={togglePlay}
            disabled={!hasRecording || isRecording}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
              !hasRecording || isRecording
                ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
                : isPlayingLoop
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {isPlayingLoop ? '■ Stop' : '▶ Play'}
          </button>

          {/* Clear */}
          <button
            onClick={clear}
            disabled={!hasRecording}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              !hasRecording
                ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            Clear
          </button>
        </div>

        {/* Load / Save */}
        <div className="flex gap-2 w-full">
          <button
            onClick={upload}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Load File
          </button>
          <button
            onClick={download}
            disabled={!hasRecording}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              !hasRecording
                ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            Save WAV
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs text-gray-500 w-14 shrink-0">Volume</span>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="flex-1 accent-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}
