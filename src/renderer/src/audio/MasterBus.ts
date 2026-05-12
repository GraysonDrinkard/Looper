import { getAudioContext } from './AudioContextManager'

// Singleton master gain — all loop tracks route through here before the speakers
let masterGain: GainNode | null = null

export function getMasterGain(): GainNode {
  if (!masterGain) {
    const ctx = getAudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 1
    masterGain.connect(ctx.destination)
  }
  return masterGain
}
