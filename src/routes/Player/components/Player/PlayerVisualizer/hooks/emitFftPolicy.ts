export function shouldEmitFft (isPlaying: boolean): boolean {
  return isPlaying || !isPlaying
}
