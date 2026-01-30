import { describe, it, expect } from 'vitest'
import {
  NODE_WIDTH,
  NODE_HEADER_HEIGHT,
  JACK_SIZE,
  JACK_GAP,
  getInputJackCenter,
  getOutputJackCenter,
} from './patchbayLayout'

describe('patchbayLayout', () => {
  it('computes output jack center on the right edge', () => {
    const x = 100
    const y = 50
    const pos = getOutputJackCenter(x, y)
    expect(pos.x).toBeGreaterThanOrEqual(x + NODE_WIDTH - JACK_SIZE)
    expect(pos.y).toBeCloseTo(y + NODE_HEADER_HEIGHT / 2, 4)
  })

  it('stacks input jacks with gap', () => {
    const x = 100
    const y = 50
    const count = 2
    const first = getInputJackCenter(x, y, 0, count)
    const second = getInputJackCenter(x, y, 1, count)
    expect(second.y - first.y).toBeCloseTo(JACK_SIZE + JACK_GAP, 4)
  })
})
