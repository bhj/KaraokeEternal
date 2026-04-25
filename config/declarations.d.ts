declare module '*.css' {
  const classes: { [key: string]: string }
  export = classes
}

interface Window {
  webkitAudioContext: typeof AudioContext
}

declare const module: {
  hot?: {
    accept(path: string, callback: () => Promise<void> | void): void
  }
}
