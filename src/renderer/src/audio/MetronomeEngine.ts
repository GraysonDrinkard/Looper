// Lookahead scheduler pattern: schedules audio via AudioContext.currentTime
// (never setTimeout/setInterval for timing — those drift)
type BeatCallback = (beat: number, bar: number) => void

export class MetronomeEngine {
  private readonly ctx: AudioContext
  private bpm: number
  private beatsPerBar: number
  private running = false
  private currentBeat = 0
  private currentBar = 0
  private nextBeatTime = 0
  private timerId: ReturnType<typeof setTimeout> | null = null
  private callbacks: BeatCallback[] = []

  private static readonly LOOKAHEAD_MS = 25
  private static readonly SCHEDULE_AHEAD_S = 0.1

  constructor(ctx: AudioContext, bpm = 120, beatsPerBar = 4) {
    this.ctx = ctx
    this.bpm = bpm
    this.beatsPerBar = beatsPerBar
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.currentBeat = 0
    this.currentBar = 0
    this.nextBeatTime = this.ctx.currentTime + 0.05
    this.tick()
  }

  stop(): void {
    this.running = false
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  setBpm(bpm: number): void { this.bpm = bpm }
  setBeatsPerBar(beats: number): void { this.beatsPerBar = beats; this.currentBeat = 0 }

  onBeat(cb: BeatCallback): () => void {
    this.callbacks.push(cb)
    return () => { this.callbacks = this.callbacks.filter(c => c !== cb) }
  }

  get isRunning(): boolean { return this.running }
  get secondsPerBeat(): number { return 60 / this.bpm }
  get secondsPerBar(): number { return this.secondsPerBeat * this.beatsPerBar }
  get nextBeatAt(): number { return this.nextBeatTime }

  private tick(): void {
    while (this.nextBeatTime < this.ctx.currentTime + MetronomeEngine.SCHEDULE_AHEAD_S) {
      this.scheduleClick(this.nextBeatTime, this.currentBeat)
      this.fireCallbacks(this.nextBeatTime, this.currentBeat, this.currentBar)
      this.advance()
    }
    this.timerId = setTimeout(() => { if (this.running) this.tick() }, MetronomeEngine.LOOKAHEAD_MS)
  }

  private scheduleClick(time: number, beat: number): void {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.frequency.value = beat === 0 ? 1000 : 800
    gain.gain.setValueAtTime(beat === 0 ? 0.7 : 0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time)
    osc.stop(time + 0.06)
  }

  private fireCallbacks(time: number, beat: number, bar: number): void {
    const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000)
    setTimeout(() => this.callbacks.forEach(cb => cb(beat, bar)), delayMs)
  }

  private advance(): void {
    this.nextBeatTime += 60 / this.bpm
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar
    if (this.currentBeat === 0) this.currentBar++
  }
}
