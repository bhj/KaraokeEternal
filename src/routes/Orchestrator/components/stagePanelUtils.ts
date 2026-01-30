export type StageBuffer = 'o0' | 'o1' | 'o2' | 'o3' | 'grid'

export const BUFFER_OPTIONS: { key: StageBuffer, label: string }[] = [
  { key: 'o0', label: 'o0' },
  { key: 'o1', label: 'o1' },
  { key: 'o2', label: 'o2' },
  { key: 'o3', label: 'o3' },
  { key: 'grid', label: 'grid' },
]

export function buildPreviewCode (code: string, buffer: StageBuffer): string {
  const trimmed = code.trim()
  if (!trimmed) return ''
  if (buffer === 'grid') {
    return `${trimmed}\nrender()`
  }
  return `${trimmed}\nsrc(${buffer}).out(o0)`
}
