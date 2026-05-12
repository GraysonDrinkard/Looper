import { create } from 'zustand'

export type TrackState = 'idle' | 'recording' | 'playing' | 'stopped'

export interface LoopTrack {
  id: string
  audioBuffer: AudioBuffer | null
  volume: number
  muted: boolean
  soloed: boolean
  state: TrackState
}

interface LooperStore {
  bpm: number
  timeSignature: { beats: number; noteValue: number }
  metronomeRunning: boolean
  tracks: LoopTrack[]

  setBpm: (bpm: number) => void
  setTimeSignature: (beats: number, noteValue: number) => void
  setMetronomeRunning: (running: boolean) => void
  addTrack: () => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<LoopTrack>) => void
}

export const useLooperStore = create<LooperStore>((set) => ({
  bpm: 120,
  timeSignature: { beats: 4, noteValue: 4 },
  metronomeRunning: false,
  tracks: [],

  setBpm: (bpm) => set({ bpm }),
  setTimeSignature: (beats, noteValue) => set({ timeSignature: { beats, noteValue } }),
  setMetronomeRunning: (running) => set({ metronomeRunning: running }),

  addTrack: () =>
    set((s) => ({
      tracks: [
        ...s.tracks,
        {
          id: crypto.randomUUID(),
          audioBuffer: null,
          volume: 1,
          muted: false,
          soloed: false,
          state: 'idle',
        },
      ],
    })),

  removeTrack: (id) => set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) })),

  updateTrack: (id, updates) =>
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}))
