declare module 'redux-throttle' {
  import type { Middleware } from 'redux'
  export const CANCEL: unique string
  export default function middleware (defaultWait: number, defaultThrottleOption: {
    leading?: boolean
    trailing?: boolean
  }): Middleware
}
