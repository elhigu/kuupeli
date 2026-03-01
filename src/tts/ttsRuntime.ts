const encoder = new TextEncoder()

export async function synthesizeSentence(text: string): Promise<ArrayBuffer> {
  const encoded = encoder.encode(text)
  const wavHeader = new Uint8Array([82, 73, 70, 70]) // RIFF marker bytes
  const merged = new Uint8Array(wavHeader.length + encoded.length)

  merged.set(wavHeader, 0)
  merged.set(encoded, wavHeader.length)

  return merged.buffer
}
