import { useState } from 'react'

// Returns className each time toggle changes, until the element's CSS
// animation ends; pass both returned props to the animated element(s)
export default function useToggleAnimation (toggle: boolean, className: string) {
  const [animating, setAnimating] = useState(false)
  const [prevToggle, setPrevToggle] = useState(toggle)

  if (toggle !== prevToggle) {
    setPrevToggle(toggle)
    setAnimating(true)
  }

  // don't attach the event handler until we really need to
  return animating
    ? { className, onAnimationEnd: () => setAnimating(false) }
    : { className: undefined, onAnimationEnd: undefined }
}
