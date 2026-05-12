import { useMultiTrack } from '@renderer/hooks/useMultiTrack'
import { TransportBar } from '@renderer/components/shared/TransportBar'
import { TrackRow } from './TrackRow'

const MAX_TRACKS = 8

export function AdvancedMode() {
  const { tracks, addTrack, removeTrack, toggleRecord, togglePlay, setVolume, setMuted, setSoloed, setTrim, seekTrack, clearTrack, downloadTrack, uploadTrack } = useMultiTrack()

  return (
    <div className="flex flex-col h-full">
      <TransportBar />

      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm select-none">
            No tracks yet — add one below
          </div>
        ) : (
          tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i}
              onToggleRecord={() => toggleRecord(track.id)}
              onTogglePlay={() => togglePlay(track.id)}
              onSetVolume={v => setVolume(track.id, v)}
              onSetMuted={m => setMuted(track.id, m)}
              onSetSoloed={s => setSoloed(track.id, s)}
              onSetTrim={(start, end) => setTrim(track.id, start, end)}
              onSlideEnd={() => seekTrack(track.id)}
              onClear={() => clearTrack(track.id)}
              onRemove={() => removeTrack(track.id)}
              onDownload={() => downloadTrack(track.id, `track-${i + 1}`)}
              onUpload={() => uploadTrack(track.id)}
            />
          ))
        )}
      </div>

      {tracks.length < MAX_TRACKS && (
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <button
            onClick={addTrack}
            className="w-full py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors border border-dashed border-gray-800 hover:border-gray-600"
          >
            + Add Track
          </button>
        </div>
      )}
    </div>
  )
}
