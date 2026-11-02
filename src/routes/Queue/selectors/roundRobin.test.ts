import { describe, it, expect } from 'vitest'
import roundRobin from './roundRobin.js'

describe('roundRobin', () => {
  it('alternates users, earlier users first on a tie', () => {
    const lists = new Map([[1, ['a1', 'a2']], [2, ['b1', 'b2']]])
    expect(roundRobin(lists, [])).toEqual(['a1', 'b1', 'a2', 'b2'])
  })

  it('gives the first turn to the user who has gone longest', () => {
    const lists = new Map([[1, ['a1']], [2, ['b1']], [3, ['c1']]])
    // 1 sang longest ago, 2 just sang, 3 never has
    expect(roundRobin(lists, [1, 2])).toEqual(['c1', 'a1', 'b1'])
  })

  it('runs out one user\'s items before the others', () => {
    const lists = new Map([[1, ['a1', 'a2', 'a3']], [2, ['b1']]])
    expect(roundRobin(lists, [])).toEqual(['a1', 'b1', 'a2', 'a3'])
  })

  it('skips users with no items', () => {
    const lists = new Map([[1, []], [2, ['b1']]])
    expect(roundRobin(lists, [])).toEqual(['b1'])
  })

  it('does not modify its inputs', () => {
    const lists = new Map([[1, ['a1', 'a2']], [2, ['b1']]])
    const played = [2]
    roundRobin(lists, played)
    expect(lists).toEqual(new Map([[1, ['a1', 'a2']], [2, ['b1']]]))
    expect(played).toEqual([2])
  })
})
