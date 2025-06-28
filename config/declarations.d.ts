declare module '*.css' {
  const classes: { [key: string]: string }
  export = classes
}

interface Window {
  webkitAudioContext: typeof AudioContext
}

declare module 'gl-chromakey' {
  export default class GLChroma {
    constructor (video: HTMLVideoElement, canvas: HTMLCanvasElement | WebGLRenderingContext)
    key (options: { color: string | 'auto', amount: number }): void
    unload (): void
    render (): void
  }
}
