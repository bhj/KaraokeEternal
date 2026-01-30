declare module 'hydra-synth' {
  interface HydraOptions {
    canvas?: HTMLCanvasElement
    width?: number
    height?: number
    autoLoop?: boolean
    makeGlobal?: boolean
    detectAudio?: boolean
    numSources?: number
    numOutputs?: number
    precision?: 'highp' | 'mediump' | 'lowp'
  }

  interface HydraSynth {
    osc: (freq?: number | (() => number), sync?: number | (() => number), offset?: number | (() => number)) => HydraSource
    noise: (scale?: number | (() => number), offset?: number | (() => number)) => HydraSource
    voronoi: (scale?: number | (() => number), speed?: number | (() => number), blending?: number | (() => number)) => HydraSource
    shape: (sides?: number | (() => number), radius?: number | (() => number), smoothing?: number | (() => number)) => HydraSource
    gradient: (speed?: number | (() => number)) => HydraSource
    src: (source: HydraOutput) => HydraSource
    render: (output?: HydraOutput) => void
    a: HydraAudio
    o0: HydraOutput
    o1: HydraOutput
    o2: HydraOutput
    o3: HydraOutput
    s0: HydraExtSource
    s1: HydraExtSource
    s2: HydraExtSource
    s3: HydraExtSource
  }

  interface HydraSource {
    out: (output?: HydraOutput) => void
    rotate: (angle?: number | (() => number), speed?: number | (() => number)) => HydraSource
    scale: (amount?: number | (() => number)) => HydraSource
    kaleid: (sides?: number | (() => number)) => HydraSource
    modulate: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    blend: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    add: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    diff: (source: HydraSource) => HydraSource
    color: (r?: number | (() => number), g?: number | (() => number), b?: number | (() => number)) => HydraSource
    saturate: (amount?: number | (() => number)) => HydraSource
    colorama: (amount?: number | (() => number)) => HydraSource
    repeat: (x?: number | (() => number), y?: number | (() => number)) => HydraSource
    pixelate: (x?: number | (() => number), y?: number | (() => number)) => HydraSource
    scrollX: (amount?: number | (() => number), speed?: number | (() => number)) => HydraSource
    scrollY: (amount?: number | (() => number), speed?: number | (() => number)) => HydraSource
    hue: (amount?: number | (() => number)) => HydraSource
    brightness: (amount?: number | (() => number)) => HydraSource
    invert: (amount?: number | (() => number)) => HydraSource
    modulateRotate: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    modulateScale: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    mult: (source: HydraSource, amount?: number | (() => number)) => HydraSource
    [key: string]: unknown
  }

  type HydraOutput = Record<string, unknown>
  interface HydraExtSource {
    initCam: (index?: number) => void
  }
  interface HydraAudio {
    fft: number[]
    vol: number
    show: () => void
    hide: () => void
    setBins: (n: number) => void
    setSmooth: (n: number) => void
    setScale: (n: number) => void
    setCutoff: (n: number) => void
  }

  class Hydra {
    constructor (opts?: HydraOptions)
    synth: HydraSynth
    eval: (code: string) => void
    tick: (dt: number) => void
    setResolution: (width: number, height: number) => void
    regl: { destroy: () => void }
  }

  export default Hydra
}
