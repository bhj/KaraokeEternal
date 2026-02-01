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
  if (typeof obj !== 'object' || obj === null) return false
  const r = obj as Record<string, unknown>
  return Array.isArray(r.fft)
    && typeof r.bass === 'number'
    && typeof r.mid === 'number'
    && typeof r.treble === 'number'
    && typeof r.beat === 'number'
    && typeof r.energy === 'number'
    && typeof r.bpm === 'number'
    && typeof r.bright === 'number'
}
