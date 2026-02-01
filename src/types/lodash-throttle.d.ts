declare module 'lodash/throttle' {
  import type { DebouncedFunc } from 'lodash'

  function throttle<T extends (...args: unknown[]) => unknown> (
    func: T,
    wait?: number,
    options?: {
      leading?: boolean
      trailing?: boolean
    },
  ): DebouncedFunc<T>

  export default throttle
}
