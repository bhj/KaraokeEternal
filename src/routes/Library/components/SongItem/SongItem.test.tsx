import { describe, it, expect } from 'vitest'
import SongItem from './SongItem'

describe('SongItem', () => {
  // This test verifies React.memo behavior
  it('should be memoized (wrapped in React.memo)', () => {
    // React.memo components have $$typeof === Symbol.for('react.memo')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentType = SongItem as any

    expect(componentType.$$typeof).toBe(Symbol.for('react.memo'))
  })
})
