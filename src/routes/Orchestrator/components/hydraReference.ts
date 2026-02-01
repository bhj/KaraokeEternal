export interface HydraFuncRef {
  name: string
  params: { name: string, default: number | string, range?: string }[]
}

export interface HydraRefCategory {
  label: string
  color: string
  functions: HydraFuncRef[]
}

export interface AudioRef {
  name: string
  range: string
  description: string
}

export const AUDIO_REFERENCE: AudioRef[] = [
  { name: 'bass()', range: '0–516 Hz', description: 'Low-end energy (kicks, bass)' },
  { name: 'mid()', range: '516–11k Hz', description: 'Midrange (vocals, guitar)' },
  { name: 'treble()', range: '11k+ Hz', description: 'High-end (cymbals, sibilance)' },
  { name: 'beat()', range: '0–1 spike', description: 'Transient/kick detection' },
  { name: 'energy()', range: '0–1 RMS', description: 'Overall loudness' },
  { name: 'bpm()', range: '0–1 tempo', description: 'Tempo estimate (0.5 ≈ 120)' },
  { name: 'bright()', range: '0–1', description: 'Spectral brightness' },
  { name: 'a.fft[n]', range: '0–1', description: 'Native frequency bin (0=bass)' },
  { name: 'a.setBins(n)', range: '1–128', description: 'Set FFT bin count' },
  { name: 'a.setSmooth(v)', range: '0–1', description: 'Set temporal smoothing' },
  { name: 'a.setScale(v)', range: '0–10', description: 'Set amplitude scale' },
]

export const HYDRA_REFERENCE: HydraRefCategory[] = [
  {
    label: 'Sources',
    color: '#4fc3f7',
    functions: [
      { name: 'osc', params: [{ name: 'freq', default: 60 }, { name: 'sync', default: 0.1 }, { name: 'offset', default: 0 }] },
      { name: 'noise', params: [{ name: 'scale', default: 10 }, { name: 'offset', default: 0.1 }] },
      { name: 'voronoi', params: [{ name: 'scale', default: 5 }, { name: 'speed', default: 0.3 }, { name: 'blending', default: 0.3 }] },
      { name: 'shape', params: [{ name: 'sides', default: 3 }, { name: 'radius', default: 0.3 }, { name: 'smoothing', default: 0.01 }] },
      { name: 'gradient', params: [{ name: 'speed', default: 0 }] },
      { name: 'solid', params: [{ name: 'r', default: 0 }, { name: 'g', default: 0 }, { name: 'b', default: 0 }, { name: 'a', default: 1 }] },
      { name: 'src', params: [{ name: 'tex', default: 'o0' }] },
      { name: 'prev', params: [] },
    ],
  },
  {
    label: 'Transforms',
    color: '#81c784',
    functions: [
      { name: '.rotate', params: [{ name: 'angle', default: 10 }, { name: 'speed', default: 0 }] },
      { name: '.scale', params: [{ name: 'amount', default: 1.5 }, { name: 'xMult', default: 1 }, { name: 'yMult', default: 1 }] },
      { name: '.pixelate', params: [{ name: 'x', default: 20 }, { name: 'y', default: 20 }] },
      { name: '.repeat', params: [{ name: 'x', default: 3 }, { name: 'y', default: 3 }, { name: 'offsetX', default: 0 }, { name: 'offsetY', default: 0 }] },
      { name: '.repeatX', params: [{ name: 'reps', default: 3 }, { name: 'offset', default: 0 }] },
      { name: '.repeatY', params: [{ name: 'reps', default: 3 }, { name: 'offset', default: 0 }] },
      { name: '.kaleid', params: [{ name: 'sides', default: 4 }] },
      { name: '.scrollX', params: [{ name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
      { name: '.scrollY', params: [{ name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
    ],
  },
  {
    label: 'Color',
    color: '#ffb74d',
    functions: [
      { name: '.color', params: [{ name: 'r', default: 1 }, { name: 'g', default: 1 }, { name: 'b', default: 1 }] },
      { name: '.brightness', params: [{ name: 'amount', default: 0.4 }] },
      { name: '.contrast', params: [{ name: 'amount', default: 1.6 }] },
      { name: '.invert', params: [{ name: 'amount', default: 1 }] },
      { name: '.saturate', params: [{ name: 'amount', default: 2 }] },
      { name: '.posterize', params: [{ name: 'bins', default: 3 }, { name: 'gamma', default: 0.6 }] },
      { name: '.shift', params: [{ name: 'r', default: 0.5 }, { name: 'g', default: 0 }, { name: 'b', default: 0 }, { name: 'a', default: 0 }] },
      { name: '.luma', params: [{ name: 'threshold', default: 0.5 }, { name: 'tolerance', default: 0.1 }] },
      { name: '.hue', params: [{ name: 'amount', default: 0.4 }] },
      { name: '.colorama', params: [{ name: 'amount', default: 0.005 }] },
    ],
  },
  {
    label: 'Combine',
    color: '#e57373',
    functions: [
      { name: '.add', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }] },
      { name: '.sub', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }] },
      { name: '.mult', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }] },
      { name: '.blend', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.5 }] },
      { name: '.layer', params: [{ name: 'tex', default: 'osc()' }] },
      { name: '.diff', params: [{ name: 'tex', default: 'osc()' }] },
      { name: '.mask', params: [{ name: 'tex', default: 'osc()' }] },
    ],
  },
  {
    label: 'Modulate',
    color: '#ba68c8',
    functions: [
      { name: '.modulate', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.1 }] },
      { name: '.modulateScale', params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 1 }, { name: 'offset', default: 1 }] },
      { name: '.modulateRotate', params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 1 }, { name: 'offset', default: 0 }] },
      { name: '.modulatePixelate', params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 10 }, { name: 'offset', default: 3 }] },
      { name: '.modulateRepeat', params: [{ name: 'tex', default: 'osc()' }, { name: 'x', default: 3 }, { name: 'y', default: 3 }] },
      { name: '.modulateKaleid', params: [{ name: 'tex', default: 'osc()' }, { name: 'sides', default: 4 }] },
      { name: '.modulateHue', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }] },
      { name: '.modulateScrollX', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
      { name: '.modulateScrollY', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
    ],
  },
]
