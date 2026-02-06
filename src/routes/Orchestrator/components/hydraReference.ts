export interface HydraParamRef {
  name: string
  default: number | string
  range?: string
}

export interface HydraFuncRef {
  name: string
  params: HydraParamRef[]
  description: string
  whenToUse: string
  pitfall: string
  related: string[]
  example: string
}

type HydraFuncSeed = {
  name: string
  params: HydraParamRef[]
} & Partial<Omit<HydraFuncRef, 'name' | 'params'>>

export interface HydraRefCategory {
  label: string
  color: string
  functions: HydraFuncRef[]
}

interface HydraRefCategorySeed {
  label: string
  color: string
  functions: HydraFuncSeed[]
}

export interface AudioRef {
  name: string
  range: string
  description: string
}

export const AUDIO_REFERENCE: AudioRef[] = [
  { name: 'a.fft[n]', range: '0–1', description: 'Native frequency bin (0 = bass)' },
  { name: 'a.setBins(n)', range: '2–64', description: 'Set FFT bin count' },
  { name: 'a.setSmooth(v)', range: '0–1', description: 'Set temporal smoothing' },
  { name: 'a.setScale(v)', range: '0–3', description: 'Set amplitude scale' },
]

const CATEGORY_DEFAULT_RELATED: Record<string, string[]> = {
  'Sources': ['src', 'osc'],
  'Transforms': ['.rotate', '.scale'],
  'Color': ['.color', '.contrast'],
  'Combine': ['.blend', '.layer'],
  'Modulate': ['.modulate', '.modulateScale'],
  'Camera / External Sources': ['src', 's0.initCam'],
}

function formatDefaultValue (value: number | string): string {
  return typeof value === 'number' ? String(value) : value
}

function buildDefaultExample (fn: HydraFuncSeed): string {
  const args = fn.params.map(param => formatDefaultValue(param.default)).join(', ')

  if (fn.name.startsWith('.')) {
    return `osc(10, 0.1, 0)\n  ${fn.name}(${args})\n  .out(o0)`
  }

  if (fn.name.endsWith('.initCam') || fn.name.endsWith('.initImage') || fn.name.endsWith('.initVideo') || fn.name.endsWith('.initScreen')) {
    const source = fn.name.split('.')[0]
    return `${fn.name}(${args})\nsrc(${source}).out(o0)`
  }

  if (fn.name === 'prev') {
    return 'src(o0).blend(prev(), 0.5).out(o0)'
  }

  return `${fn.name}(${args}).out(o0)`
}

function buildDefaultDescription (categoryLabel: string, fn: HydraFuncSeed): string {
  if (fn.name.startsWith('.')) {
    return `${fn.name} is a ${categoryLabel.toLowerCase()} chain operator for the current texture.`
  }
  if (/^s[0-3]\./.test(fn.name)) {
    return `${fn.name} configures an external source buffer for camera, image, video, or screen input.`
  }
  return `${fn.name} is a ${categoryLabel.toLowerCase()} function for building Hydra visual signal flow.`
}

function buildDefaultWhenToUse (categoryLabel: string, fn: HydraFuncSeed): string {
  return `Use ${fn.name} when shaping ${categoryLabel.toLowerCase()} behavior in your sketch.`
}

function buildDefaultPitfall (fn: HydraFuncSeed): string {
  return `${fn.name} can become unstable with extreme values; tune incrementally while monitoring preview output.`
}

function buildRelated (categoryLabel: string, fn: HydraFuncSeed): string[] {
  const source = fn.related && fn.related.length > 0
    ? fn.related
    : (CATEGORY_DEFAULT_RELATED[categoryLabel] ?? ['osc'])
  const filtered = source.filter(name => name !== fn.name)
  return filtered.length > 0 ? filtered : ['osc']
}

function finalizeFunction (categoryLabel: string, fn: HydraFuncSeed): HydraFuncRef {
  return {
    name: fn.name,
    params: fn.params,
    description: fn.description ?? buildDefaultDescription(categoryLabel, fn),
    whenToUse: fn.whenToUse ?? buildDefaultWhenToUse(categoryLabel, fn),
    pitfall: fn.pitfall ?? buildDefaultPitfall(fn),
    related: buildRelated(categoryLabel, fn),
    example: fn.example ?? buildDefaultExample(fn),
  }
}

const HYDRA_REFERENCE_SEED: HydraRefCategorySeed[] = [
  {
    label: 'Sources',
    color: '#4fc3f7',
    functions: [
      {
        name: 'osc',
        params: [{ name: 'freq', default: 60 }, { name: 'sync', default: 0.1 }, { name: 'offset', default: 0 }],
        description: 'Core oscillator source for rhythmic stripes and phase motion.',
        whenToUse: 'Start most sketches from osc() when you need clean periodic movement.',
        pitfall: 'High freq plus high sync can alias hard on low-end devices.',
        related: ['.rotate', '.modulate', 'noise'],
        example: 'osc(24, 0.08, 0).out(o0)',
      },
      {
        name: 'noise',
        params: [{ name: 'scale', default: 10 }, { name: 'offset', default: 0.1 }],
        description: 'Organic grain source for turbulence and texture modulation.',
        whenToUse: 'Use noise() to break up rigid patterns from osc() or shape().',
        pitfall: 'Large scale values can flatten variation and feel static.',
        related: ['osc', '.modulateScale'],
        example: 'noise(8, 0.05).out(o0)',
      },
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
      {
        name: '.rotate',
        params: [{ name: 'angle', default: 10 }, { name: 'speed', default: 0 }],
        description: 'Rotate the incoming texture around center.',
        whenToUse: 'Use gentle rotation to keep static scenes alive over time.',
        pitfall: 'Large speed values can induce strobing and motion blur artifacts.',
        related: ['.scrollX', '.scrollY'],
        example: 'osc(10, 0.1, 0).rotate(0.5, 0.02).out(o0)',
      },
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
      {
        name: '.color',
        params: [{ name: 'r', default: 1 }, { name: 'g', default: 1 }, { name: 'b', default: 1 }],
        description: 'Apply RGB tint multipliers to the signal.',
        whenToUse: 'Use color() early in a chain to establish palette direction.',
        pitfall: 'Large channel values can clip and reduce tonal detail.',
        related: ['.saturate', '.hue'],
        example: 'osc(20, 0.03, 1).color(1, 0.7, 1.2).out(o0)',
      },
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
      {
        name: '.add',
        params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }],
        description: 'Add two textures together for brighter composite layers.',
        whenToUse: 'Use add() for glow, haze, and additive build-up.',
        pitfall: 'Stacking many add() calls can overexpose quickly.',
        related: ['.blend', '.mult'],
        example: 'osc(10, 0.1, 0).add(noise(4, 0.2), 0.35).out(o0)',
      },
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
      {
        name: '.modulate',
        params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.1 }],
        description: 'Warp a texture using another texture as distortion signal.',
        whenToUse: 'Use modulate() for fluid movement and signal-reactive warping.',
        pitfall: 'High amount values can collapse detail into noisy smearing.',
        related: ['.modulateScale', '.modulateRotate'],
        example: 'osc(12, 0.02, 0).modulate(noise(4, 0.1), 0.2).out(o0)',
      },
      { name: '.modulateScale', params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 1 }, { name: 'offset', default: 1 }] },
      {
        name: '.modulateRotate',
        params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 1 }, { name: 'offset', default: 0 }],
        description: 'Rotate phase according to a modulation texture.',
        whenToUse: 'Use for spin turbulence that stays tied to another buffer.',
        pitfall: 'Large multiple values can jitter at low frame rates.',
        related: ['.rotate', '.modulate'],
        example: 'osc(8, 0.1, 1).modulateRotate(noise(2, 0.05), 1.2, 0).out(o0)',
      },
      { name: '.modulatePixelate', params: [{ name: 'tex', default: 'osc()' }, { name: 'multiple', default: 10 }, { name: 'offset', default: 3 }] },
      { name: '.modulateRepeat', params: [{ name: 'tex', default: 'osc()' }, { name: 'x', default: 3 }, { name: 'y', default: 3 }] },
      { name: '.modulateKaleid', params: [{ name: 'tex', default: 'osc()' }, { name: 'sides', default: 4 }] },
      { name: '.modulateHue', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 1 }] },
      { name: '.modulateScrollX', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
      { name: '.modulateScrollY', params: [{ name: 'tex', default: 'osc()' }, { name: 'amount', default: 0.5 }, { name: 'speed', default: 0 }] },
    ],
  },
  {
    label: 'Camera / External Sources',
    color: '#78909c',
    functions: [
      {
        name: 's0.initCam',
        params: [{ name: 'index', default: 0 }],
        description: 'Initialize the default camera feed into source buffer `s0`.',
        whenToUse: 'Call before `src(s0)` whenever you want live camera texture.',
        pitfall: 'Forgetting initCam leads to blank source output in many browsers.',
        related: ['src', 's0.initVideo'],
        example: 's0.initCam(0)\nsrc(s0).out(o0)',
      },
      { name: 's1.initCam', params: [{ name: 'index', default: 0 }] },
      { name: 's2.initCam', params: [{ name: 'index', default: 0 }] },
      { name: 's3.initCam', params: [{ name: 'index', default: 0 }] },
      { name: 's0.initImage', params: [{ name: 'url', default: '' }] },
      { name: 's0.initVideo', params: [{ name: 'url', default: '' }] },
      { name: 's0.initScreen', params: [] },
    ],
  },
]

export const HYDRA_REFERENCE: HydraRefCategory[] = HYDRA_REFERENCE_SEED.map(category => ({
  label: category.label,
  color: category.color,
  functions: category.functions.map(fn => finalizeFunction(category.label, fn)),
}))
