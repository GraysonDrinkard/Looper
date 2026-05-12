export function encodeWav(buffer: AudioBuffer, trimStart: number, trimEnd: number): ArrayBuffer {
  const sampleRate = buffer.sampleRate
  const numChannels = buffer.numberOfChannels
  const startSample = Math.round(trimStart * sampleRate)
  const endSample = Math.round(trimEnd * sampleRate)
  const numSamples = Math.max(0, endSample - startSample)

  const dataSize = numSamples * numChannels * 2 // 16-bit = 2 bytes per sample
  const fileSize = 44 + dataSize
  const out = new ArrayBuffer(fileSize)
  const view = new DataView(out)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, fileSize - 8, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)        // PCM chunk size
  view.setUint16(20, 1, true)         // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true) // byte rate
  view.setUint16(32, numChannels * 2, true)              // block align
  view.setUint16(34, 16, true)        // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[startSample + i] ?? 0
      const clamped = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
      offset += 2
    }
  }

  return out
}
