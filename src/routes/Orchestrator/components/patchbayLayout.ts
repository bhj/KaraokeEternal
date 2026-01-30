export const NODE_WIDTH = 220
export const NODE_HEADER_HEIGHT = 36
export const JACK_SIZE = 16
export const JACK_GAP = 4
export const JACK_INSET_X = 8

export interface Point {
  x: number
  y: number
}

export function getInputJackCenter (
  nodeX: number,
  nodeY: number,
  portIndex: number,
  portCount: number,
): Point {
  const stackHeight = portCount * JACK_SIZE + Math.max(0, portCount - 1) * JACK_GAP
  const topOffset = (NODE_HEADER_HEIGHT - stackHeight) / 2
  return {
    x: nodeX + JACK_INSET_X + JACK_SIZE / 2,
    y: nodeY + topOffset + portIndex * (JACK_SIZE + JACK_GAP) + JACK_SIZE / 2,
  }
}

export function getOutputJackCenter (nodeX: number, nodeY: number): Point {
  return {
    x: nodeX + NODE_WIDTH - JACK_INSET_X - JACK_SIZE / 2,
    y: nodeY + NODE_HEADER_HEIGHT / 2,
  }
}

export function buildConnectionPath (from: Point, to: Point): string {
  const cx = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${to.y}, ${to.x} ${to.y}`
}
