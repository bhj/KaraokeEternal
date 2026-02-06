import { HYDRA_REFERENCE, type HydraFuncRef } from './hydraReference'

export interface HydraCompletion {
  label: string
  detail: string
  section: string
  info: string
}

function buildInfo (fn: HydraFuncRef): string {
  const related = fn.related.length > 0 ? `\nRelated: ${fn.related.join(', ')}` : ''
  return `${fn.description}\nWhen to use: ${fn.whenToUse}\nPitfall: ${fn.pitfall}${related}`
}

export function buildHydraCompletions (): { topLevel: HydraCompletion[], dotChain: HydraCompletion[], nativeAudioDot: HydraCompletion[], sourceDot: HydraCompletion[] } {
  const topLevel: HydraCompletion[] = []
  const dotChain: HydraCompletion[] = []
  const sourceDotSet = new Map<string, HydraCompletion>()

  for (const cat of HYDRA_REFERENCE) {
    for (const fn of cat.functions) {
      const sig = `(${fn.params.map(p => `${p.name}=${p.default}`).join(', ')})`
      const info = buildInfo(fn)
      if (fn.name.startsWith('.')) {
        dotChain.push({ label: fn.name, detail: sig, section: cat.label, info })
      } else if (/^s[0-3]\./.test(fn.name)) {
        const method = fn.name.replace(/^s[0-3]\./, '')
        if (!sourceDotSet.has(method)) {
          sourceDotSet.set(method, { label: method, detail: sig, section: cat.label, info })
        }
      } else {
        topLevel.push({ label: fn.name, detail: sig, section: cat.label, info })
      }
    }
  }

  const sourceDot = Array.from(sourceDotSet.values())

  dotChain.push({
    label: '.out',
    detail: '(output=o0)',
    section: 'Output',
    info: 'Route the current chain to an output buffer. Use .out(o0) or another buffer when layering.',
  })

  const nativeAudio: Array<{ label: string, detail: string, info: string }> = [
    { label: 'a.fft', detail: '[n] → 0–1 frequency bin', info: 'Read current FFT bin amplitude. Lower bins are bass, higher bins are treble.' },
    { label: 'a.setBins', detail: '(n) → set bin count', info: 'Set FFT resolution. Higher bins provide more detail with less stability.' },
    { label: 'a.setSmooth', detail: '(v) → set smoothing', info: 'Smooth audio response over time. Higher values reduce flicker.' },
    { label: 'a.setScale', detail: '(v) → set scale', info: 'Scale FFT amplitudes before using a.fft[n] in expressions.' },
  ]
  for (const entry of nativeAudio) {
    topLevel.push({ label: entry.label, detail: entry.detail, section: 'Audio', info: entry.info })
  }

  const nativeAudioDot: HydraCompletion[] = [
    { label: 'fft', detail: '[n] → 0–1 frequency bin', section: 'Audio', info: 'Read current FFT bin amplitude. Lower bins are bass, higher bins are treble.' },
    { label: 'setBins', detail: '(n) → set bin count', section: 'Audio', info: 'Set FFT resolution. Higher bins provide more detail with less stability.' },
    { label: 'setSmooth', detail: '(v) → set smoothing', section: 'Audio', info: 'Smooth audio response over time. Higher values reduce flicker.' },
    { label: 'setScale', detail: '(v) → set scale', section: 'Audio', info: 'Scale FFT amplitudes before using a.fft[n] in expressions.' },
  ]

  return { topLevel, dotChain, nativeAudioDot, sourceDot }
}
