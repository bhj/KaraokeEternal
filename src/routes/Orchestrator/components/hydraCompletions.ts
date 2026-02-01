import { HYDRA_REFERENCE, AUDIO_REFERENCE } from './hydraReference'

export interface HydraCompletion {
  label: string
  detail: string
  section: string
}

export function buildHydraCompletions (): { topLevel: HydraCompletion[], dotChain: HydraCompletion[], nativeAudioDot: HydraCompletion[], sourceDot: HydraCompletion[] } {
  const topLevel: HydraCompletion[] = []
  const dotChain: HydraCompletion[] = []
  const sourceDotSet = new Map<string, HydraCompletion>()

  for (const cat of HYDRA_REFERENCE) {
    for (const fn of cat.functions) {
      const sig = `(${fn.params.map(p => `${p.name}=${p.default}`).join(', ')})`
      if (fn.name.startsWith('.')) {
        dotChain.push({ label: fn.name, detail: sig, section: cat.label })
      } else if (/^s[0-3]\./.test(fn.name)) {
        // Camera/external source methods — extract method name without sN. prefix
        const method = fn.name.replace(/^s[0-3]\./, '')
        if (!sourceDotSet.has(method)) {
          sourceDotSet.set(method, { label: method, detail: sig, section: cat.label })
        }
        // Do NOT add to topLevel — only available via sN. dot completion
      } else {
        topLevel.push({ label: fn.name, detail: sig, section: cat.label })
      }
    }
  }

  const sourceDot = Array.from(sourceDotSet.values())

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

  // Completions for `a.` prefix — labels without `a.` since CM6 keeps typed prefix
  const nativeAudioDot: HydraCompletion[] = [
    { label: 'fft', detail: '[n] → 0–1 frequency bin', section: 'Audio' },
    { label: 'setBins', detail: '(n) → set bin count', section: 'Audio' },
    { label: 'setSmooth', detail: '(v) → set smoothing', section: 'Audio' },
    { label: 'setScale', detail: '(v) → set scale', section: 'Audio' },
  ]

  return { topLevel, dotChain, nativeAudioDot, sourceDot }
}
