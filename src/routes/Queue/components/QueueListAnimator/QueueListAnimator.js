import PropTypes from 'prop-types'
import React from 'react'
import { Flipper, Flipped } from 'react-flip-toolkit'
import { useSelector } from 'react-redux'
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

const handleShouldFlip = (prev, cur) => cur === prev

const QueueListAnimator = ({ children }) => {
  const headerHeight = useSelector(state => state.ui.headerHeight)

  const items = React.Children.map(children, child => {
    return (
      <Flipped
        flipId={child.key}
        key={child.key}
        onAppear={handleEnter}
        onExit={handleExit}
        shouldFlip={handleShouldFlip}
        stagger
      >
        <div>
          {child}
        </div>
      </Flipped>
    )
  })

  return (
    <Flipper
      applyTransformOrigin={false}
      decisionData={headerHeight}
      flipKey={children}
    >
      {items}
    </Flipper>
  )
}

QueueListAnimator.propTypes = {
  children: PropTypes.node,
}

export default QueueListAnimator
