import { Track } from '@renderer/hooks/useMultiTrack'
import { Waveform } from './Waveform'

interface Props {
  track: Track
  index: number
  onToggleRecord: () => void
  onTogglePlay: () => void
  onSetVolume: (v: number) => void
  onSetMuted: (m: boolean) => void
  onSetSoloed: (s: boolean) => void
  onSetTrim: (start: number, end: number) => void
  onSlideEnd: () => void
  onClear: () => void
  onRemove: () => void
  onDownload: () => void
  onUpload: () => void
}

export function TrackRow({ track, index, onToggleRecord, onTogglePlay, onSetVolume, onSetMuted, onSetSoloed, onSetTrim, onSlideEnd, onClear, onRemove, onDownload, onUpload }: Props) {
  const isRecording = track.state === 'recording'
  const isPlaying = track.state === 'playing'
  const hasBuffer = track.buffer !== null

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 group">
      {/* Track number */}
      <span className="text-xs text-gray-600 w-4 text-center shrink-0 tabular-nums">{index + 1}</span>

      {/* Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleRecord}
          disabled={hasBuffer && !isRecording}
          title={hasBuffer ? 'Clear track before re-recording' : 'Record'}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-500 animate-pulse'
              : hasBuffer
                ? 'bg-gray-900 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : hasBuffer ? 'bg-red-900' : 'bg-red-500'}`} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={!hasBuffer || isRecording}
          title={isPlaying ? 'Stop' : 'Play'}
          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${
            !hasBuffer || isRecording
              ? 'bg-gray-900 text-gray-700 cursor-not-allowed'
              : isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-green-800 hover:bg-green-700'
          }`}
        >
          {isPlaying ? '■' : '▶'}
        </button>

        <button
          onClick={() => onSetMuted(!track.muted)}
          title="Mute"
          className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
            track.muted ? 'bg-yellow-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-500'
          }`}
        >
          M
        </button>

        <button
          onClick={() => onSetSoloed(!track.soloed)}
          title="Solo"
          className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
            track.soloed ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-500'
          }`}
        >
          S
        </button>
      </div>

      {/* Waveform / placeholder */}
      <div className="flex-1 h-14 rounded overflow-hidden bg-gray-900">
        {hasBuffer ? (
          <Waveform
            buffer={track.buffer!}
            trimStart={track.trimStart}
            trimEnd={track.trimEnd}
            onTrimChange={onSetTrim}
            onSlideEnd={onSlideEnd}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-700 select-none">
            {isRecording ? '● Recording…' : 'Empty — press record'}
          </div>
        )}
      </div>

      {/* Volume */}
      <input
        type="range" min={0} max={1} step={0.01} value={track.volume}
        onChange={e => onSetVolume(Number(e.target.value))}
        className="w-20 accent-indigo-500 shrink-0"
        title="Volume"
      />

      {/* Clear + Download + Upload + Remove (visible on hover) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onUpload}
          title="Load audio file"
          className="px-2 h-7 rounded text-xs text-gray-400 hover:bg-gray-800 transition-colors"
        >
          Load
        </button>
        <button
          onClick={onDownload}
          disabled={!hasBuffer}
          title="Download as WAV"
          className={`px-2 h-7 rounded text-xs transition-colors ${
            hasBuffer ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          Save
        </button>
        <button
          onClick={onClear}
          disabled={!hasBuffer}
          title="Clear recording"
          className={`px-2 h-7 rounded text-xs transition-colors ${
            hasBuffer ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-700 cursor-not-allowed'
          }`}
        >
          Clear
        </button>
        <button
          onClick={onRemove}
          title="Remove track"
          className="w-7 h-7 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors text-base leading-none flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </div>
  )
}
