declare module 'cdgraphics' {
  interface RenderOptions {
    /**
     * Boolean forcing the background to be transparent, even if the CD+G title did not explicitly specify it.
     * @default false
    */
    forceKey: boolean
  }

  interface Frame {
    /** ImageData object containing the rendered frame's pixel data. */
    imageData: ImageData
    /** Boolean indicating whether the frame changed since the last render. Useful for skipping unnecessary re-paints to a canvas. */
    isChanged: boolean
    /** Array containing the frame's background color in the form [r, g, b, a] with alpha being 0 or 1. The reported alpha includes the effect of the forceKey option, if enabled. */
    backgroundRGBA: [r: number, g: number, b: number, a: 0 | 1]
    /** Array containing the coordinates of a bounding box that fits the frame's non-transparent pixels in the form [x1, y1, x2, y2]. Typically only useful when the forceKey option is enabled. */
    contentBounds: [x1: number, y1: number, x2: number, y2: number]
  }

  export default class CDGraphics {
    constructor ()
    /** Loads a CD+G file from an ArrayBuffer, which can be had via the Response of a fetch(). You must load() a CD+G file before calling render(). */
    load (buffer: ArrayBuffer): void
    render (
      /** Number (in seconds) of the frame to render. Should usually be the `currentTime` of an <audio> element. */
      time: number,
      options?: RenderOptions
    ): Frame
  }
}
