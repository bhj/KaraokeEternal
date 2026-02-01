import { HYDRA_REFERENCE, AUDIO_REFERENCE } from './hydraReference'

export interface HydraCompletion {
  label: string
  detail: string
  section: string
}

export function buildHydraCompletions (): { topLevel: HydraCompletion[], dotChain: HydraCompletion[] } {
  const topLevel: HydraCompletion[] = []
  const dotChain: HydraCompletion[] = []

  for (const cat of HYDRA_REFERENCE) {
    for (const fn of cat.functions) {
      const sig = `(${fn.params.map(p => `${p.name}=${p.default}`).join(', ')})`
      if (fn.name.startsWith('.')) {
        dotChain.push({ label: fn.name, detail: sig, section: cat.label })
      } else {
        topLevel.push({ label: fn.name, detail: sig, section: cat.label })
      }
    }
  }

  // .out() is not in HYDRA_REFERENCE — add it
  dotChain.push({ label: '.out', detail: '(output=o0)', section: 'Output' })

  // Audio helpers (function-style)
  for (const ref of AUDIO_REFERENCE) {
    const name = ref.name.replace(/\(\)$/, '')
    // Only add function-style audio helpers (not a.fft etc.)
    if (!name.startsWith('a.')) {
      topLevel.push({ label: name, detail: `() → ${ref.range}`, section: 'Audio' })
    }
  }

  // Native audio API
  const nativeAudio: Array<{ label: string, detail: string }> = [
    { label: 'a.fft', detail: '[n] → 0–1 frequency bin' },
    { label: 'a.setBins', detail: '(n) → set bin count' },
    { label: 'a.setSmooth', detail: '(v) → set smoothing' },
    { label: 'a.setScale', detail: '(v) → set scale' },
  ]
  for (const entry of nativeAudio) {
    topLevel.push({ label: entry.label, detail: entry.detail, section: 'Audio' })
  }

  return { topLevel, dotChain }
}
