const DEFAULT_VERTICAL_SENSITIVITY = 150

export function clamp (value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function snapToStep (value: number, step?: number): number {
  if (!step || step <= 0) return value
  const snapped = Math.round(value / step) * step
  return Number(snapped.toFixed(6))
}

export function valueFromPosition (
  clientX: number,
  trackLeft: number,
  trackWidth: number,
  min: number,
  max: number,
  step?: number,
): number {
  if (trackWidth <= 0) return min
  const ratio = clamp((clientX - trackLeft) / trackWidth, 0, 1)
  const value = min + ratio * (max - min)
  return snapToStep(clamp(value, min, max), step)
}

export function valueFromDelta ({
  startValue,
  deltaX,
  deltaY,
  trackWidth,
  min,
  max,
  step,
  verticalSensitivity = DEFAULT_VERTICAL_SENSITIVITY,
}: {
  startValue: number
  deltaX: number
  deltaY: number
  trackWidth: number
  min: number
  max: number
  step?: number
  verticalSensitivity?: number
}): number {
  const range = max - min
  const horizontal = trackWidth > 0 ? (deltaX / trackWidth) * range : 0
  const vertical = (-deltaY / verticalSensitivity) * range
  const value = startValue + horizontal + vertical
  return snapToStep(clamp(value, min, max), step)
}
