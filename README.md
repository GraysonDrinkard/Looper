# Looper

A desktop looper pedal app for guitar, piano, or any instrument. Record, layer, and arrange loops with a built-in metronome — no internet required.

## Features

### Simple Mode
- Metronome with BPM control, tap tempo, and visual beat flash
- Single loop track: record, play/stop, clear
- Load an audio file or save your recording as a WAV

### Advanced Mode
- Metronome with BPM, tap tempo, and time signature (2/4 – 7/8)
- Up to 8 independent loop tracks
- Per track: record, play/stop, mute, solo, volume fader
- Waveform view with drag-to-trim handles and slideable playback region
- Load an audio file into any track or save it as a WAV

## Download

Grab the latest release from the [Releases](../../releases) page:

- **macOS** — open the `.dmg`, drag Looper to Applications
- **Windows** — run the `.exe` installer

No Node.js, no terminal, no setup needed.

## Development

```bash
npm install
npm run dev      # Electron + Vite dev server with hot reload
npm run build    # Production build
npm run dist     # Package distributable (.dmg / .exe)
```

Requires Node.js 18+.
