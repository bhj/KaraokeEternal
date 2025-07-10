declare module 'gl-chromakey' {
  type Key =
    'auto' |
    [r: number, g: number, b: number] |
    {
      color: [r: number, g: number, b: number] | 'auto'
      /**
       * float ranged 0-1; allowed distance from color
       * @default 0.3
       */
      tolerance?: number
      /**
       * float ranged 0-1; strength of alpha effect
       * @default 1.0
       */
      amount?: number
    }

  export default class GLChroma {
    constructor (
      /** Source video, image or canvas element to key */
      source: HTMLVideoElement,
      /** Target canvas element on which to paint keyed image(s) */
      canvas: HTMLCanvasElement | WebGLRenderingContext
    )
    /** Returns true if browser supports WebGL 2, else false. */
    hasWebGL2 (): boolean
    /**
     * Sets one or more key colors in RGB, replacing any prior settings. Calling without parameters clears all key colors.
     * The auto key color mode works by downsampling the source image, grabbing each corner pixel, and keying on the two pixels with the most similar color. It works best on video or images with simplistic backgrounds, and if the algorithm gets it wrong, can cause flickering in some cases.
     * */
    key (): void
    key (key: Key): void
    key (keys: Key[]): void
    /** Re-paints current frame to canvas */
    paint (): void
    /** Updates frame from source element and paints to target canvas */
    render (): void
    /** Sets a new source video, image or canvas element to key. */
    source (source: HTMLVideoElement): void
    /** Sets a new target canvas on which to paint keyed image(s). The context webgl2 will be used. */
    target (canvas: HTMLCanvasElement | WebGLRenderingContext): void
    /* Unload all shader and buffers */
    unload (): void
  }
}
