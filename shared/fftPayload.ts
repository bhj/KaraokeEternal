export interface FftPayload {
  fft: number[]
  bass: number
  mid: number
  treble: number
  beat: number
  energy: number
  bpm: number
  bright: number
}

export function isValidFftPayload (obj: unknown): obj is FftPayload {
  if (obj == null || typeof obj !== 'object') return false
  const p = obj as Record<string, unknown>
  return Array.isArray(p.fft) && typeof p.bass === 'number'
}
