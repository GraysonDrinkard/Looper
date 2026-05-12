import { getAudioContext } from './AudioContextManager'

export type LoopState = 'idle' | 'recording' | 'playing' | 'stopped'

export class LoopEngine {
  private readonly ctx: AudioContext
  private readonly trackGain: GainNode
  private source: AudioBufferSourceNode | null = null
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private _buffer: AudioBuffer | null = null
  private _state: LoopState = 'idle'
  private onChange: ((state: LoopState) => void) | null = null
  private trimStart = 0
  private trimEnd = -1 // -1 means full buffer

  constructor(destination: AudioNode) {
    this.ctx = getAudioContext()
    this.trackGain = this.ctx.createGain()
    this.trackGain.connect(destination)
  }

  onStateChange(cb: (state: LoopState) => void): void {
    this.onChange = cb
  }

  async startRecording(): Promise<void> {
    if (this._state === 'recording') return
    this.stopSource()
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream)
    this.recorder.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data) }
    this.recorder.start(100)
    this.setState('recording')
  }

  async stopRecording(): Promise<void> {
    if (this._state !== 'recording' || !this.recorder) return
    await new Promise<void>((resolve) => {
      this.recorder!.onstop = async () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' })
        try {
          this._buffer = await this.ctx.decodeAudioData(await blob.arrayBuffer())
        } catch {
          this.setState('idle')
          resolve()
          return
        }
        this.stream?.getTracks().forEach(t => t.stop())
        this.stream = null
        this.setState('stopped')
        resolve()
      }
      this.recorder!.stop()
    })
  }

  setTrimPoints(start: number, end: number): void {
    this.trimStart = start
    this.trimEnd = end
    // Update loop boundaries live on the existing source — no restart, no gaps
    if (this.source && this._state === 'playing') {
      const loopEnd = end > 0 ? end : this._buffer!.duration
      this.source.loopStart = start
      this.source.loopEnd = loopEnd
    }
  }

  seekToTrimStart(): void {
    if (this._state === 'playing') this.play()
  }

  play(startTime?: number): void {
    if (!this._buffer) return
    this.stopSource()
    const loopEnd = this.trimEnd > 0 ? this.trimEnd : this._buffer.duration
    this.source = this.ctx.createBufferSource()
    this.source.buffer = this._buffer
    this.source.loop = true
    this.source.loopStart = this.trimStart
    this.source.loopEnd = loopEnd
    this.source.connect(this.trackGain)
    this.source.start(startTime ?? this.ctx.currentTime, this.trimStart)
    this.setState('playing')
  }

  stop(): void {
    this.stopSource()
    if (this._state === 'playing') this.setState('stopped')
  }

  clear(): void {
    this.stopSource()
    if (this._state === 'recording') {
      this.recorder?.stop()
      this.stream?.getTracks().forEach(t => t.stop())
      this.stream = null
    }
    this._buffer = null
    this.chunks = []
    this.setState('idle')
  }

  setVolume(v: number): void {
    this.trackGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01)
  }

  loadBuffer(buffer: AudioBuffer): void {
    this._buffer = buffer
    this.setState('stopped')
  }

  get state(): LoopState { return this._state }
  get hasBuffer(): boolean { return this._buffer !== null }
  get buffer(): AudioBuffer | null { return this._buffer }

  dispose(): void {
    this.stopSource()
    this.stream?.getTracks().forEach(t => t.stop())
    this.trackGain.disconnect()
  }

  private stopSource(): void {
    if (this.source) {
      try { this.source.stop() } catch { /* already stopped */ }
      this.source.disconnect()
      this.source = null
    }
  }

  private setState(s: LoopState): void {
    this._state = s
    this.onChange?.(s)
  }
}
