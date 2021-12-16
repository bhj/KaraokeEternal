import React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import styles from './QueueListAnimator.css'

const handleEnter = (el, i) => {
  el.addEventListener('animationend', (e) => e.target.classList.remove(styles.itemEnter))
  el.classList.add(styles.itemEnter)
  el.removeAttribute('style')
}

const handleExit = (el, i, removeEl) => {
  el.addEventListener('animationend', removeEl)
  el.classList.add(styles.itemExit)
}

const QueueListAnimator = ({ children }) => {
  const items = React.Children.map(children, child => {
    return (
      <Flipped
        key={child.key}
        flipId={child.key}
        onAppear={handleEnter}
        onExit={handleExit}
        stagger
      >
        <div>
          {child}
        </div>
      </Flipped>
    )
  })

  return (
    <Flipper flipKey={children} applyTransformOrigin={false}>
      {items}
    </Flipper>
  )
}

export default QueueListAnimator
