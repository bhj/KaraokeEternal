export interface HydraSnippet {
  label: string
  code: string
}

export interface HydraSnippetCategory {
  category: string
  snippets: HydraSnippet[]
}

export const HYDRA_SNIPPETS: HydraSnippetCategory[] = [
  {
    category: 'Audio',
    snippets: [
      { label: 'fft bass', code: '() => a.fft[0]' },
      { label: 'fft mid', code: '() => a.fft[1]' },
      { label: 'fft treble', code: '() => a.fft[2]' },
      { label: 'fft pulse', code: '() => a.fft[0] * 0.5' },
      { label: 'fft gate', code: '() => a.fft[0] > 0.5 ? 1 : 0' },
    ],
  },
  {
    category: 'Camera',
    snippets: [
      { label: 'camera feed', code: 's0.initCam()\nsrc(s0).out()' },
      { label: 'camera kaleid', code: 's0.initCam()\nsrc(s0).kaleid(4).out()' },
    ],
  },
  {
    category: 'Templates',
    snippets: [
      { label: 'basic osc', code: 'osc(10, 0.1, 0.8)\n  .out()' },
      { label: 'feedback loop', code: 'osc(10)\n  .blend(o0, 0.9)\n  .out()' },
      { label: 'multi output', code: 'osc(10).out(o0)\nnoise(5).out(o1)\nrender()' },
    ],
  },
]
