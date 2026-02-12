import { useState, useEffect } from 'react'

export interface VisualViewportState {
  keyboardOffset: number
  isKeyboardOpen: boolean
}

const KEYBOARD_THRESHOLD = 100

/**
 * Pure computation: calculate keyboard offset from viewport dimensions.
 */
export function computeKeyboardOffset (
  innerHeight: number,
  vvHeight: number,
  vvOffsetTop: number,
): VisualViewportState {
  const offset = Math.max(0, innerHeight - vvHeight - vvOffsetTop)
  return {
    keyboardOffset: offset,
    isKeyboardOpen: offset > KEYBOARD_THRESHOLD,
  }
}

/**
 * Track visual viewport changes to detect soft keyboard.
 */
export function useVisualViewport (): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    keyboardOffset: 0,
    isKeyboardOpen: false,
  })

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      setState(computeKeyboardOffset(window.innerHeight, vv.height, vv.offsetTop))
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return state
}
