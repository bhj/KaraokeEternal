import React from 'react'
import clsx from 'clsx'
import { lockScrolling } from 'store/modules/ui'
import styles from './AlphaPicker.css'

interface AlphaPickerProps {
  onPick(char: string): void
  height: number
  top: number
}

interface State {
  isTouchCapable: boolean
  isTouching: boolean
  char: string | null
  y: number | null
  overlayChar: string | null // outlives char so the overlay can fade out
}

class AlphaPicker extends React.Component<AlphaPickerProps> {
  alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  state: State = {
    isTouchCapable: false,
    isTouching: false,
    char: null,
    y: null,
    overlayChar: null,
  }

  render () {
    return (
      <>
        <div
          className={styles.container}
          style={{ height: this.props.height, top: this.props.top }}
          onTouchStart={this.handleTouchStart}
          onTouchMove={this.handleTouch}
          onTouchEnd={this.handleTouchEnd}
          onTouchCancel={this.handleTouchEnd}
          onMouseDown={this.handleTouch}
          onMouseUp={this.handleTouchEnd}
          onMouseLeave={this.handleTouchEnd} // mouseup outside wouldn't reach us
        >
          {this.alphabet.map(char => (
            <div
              key={char}
              style={{ flex: '1 1 auto', minHeight: 0 }}
            >
              {char}
            </div>
          ))}
        </div>

        {this.state.overlayChar && (
          <div
            className={clsx(styles.overlay, 'bg-blur', !this.state.char && styles.fading)}
            style={{ top: this.props.top + this.props.height / 2 }}
            onAnimationEnd={this.handleOverlayAnimationEnd}
            aria-hidden
          >
            {this.state.overlayChar}
          </div>
        )}
      </>
    )
  }

  handleTouchStart = () => {
    lockScrolling(true)

    this.setState({
      isTouchCapable: true,
      isTouching: true,
    })
  }

  handleTouch = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()

    if (e.type === 'mousedown' && this.state.isTouchCapable) {
      // browser supports touch events but we got a mouse click;
      // ignore since on touch devices we want to wait for movement
      return
    }

    const isTouch = 'targetTouches' in e
    const y = isTouch ? e.targetTouches[0].clientY : e.clientY
    const char = this.alphabet[Math.floor(((y - this.props.top) / this.props.height) * this.alphabet.length)]

    // dragged past either end; keep the last char
    if (typeof char === 'undefined') return

    this.setState({
      char,
      y: y - this.props.top,
      // touch only; under a finger the picker's own letters can't be seen
      ...(isTouch && { overlayChar: char }),
    })

    // debounce
    if (char !== this.state.char) {
      this.props.onPick(char)
    }
  }

  handleTouchEnd = () => {
    lockScrolling(false)

    this.setState({
      isTouching: false,
      char: null,
    })
  }

  handleOverlayAnimationEnd = () => {
    this.setState({ overlayChar: null })
  }
}

export default AlphaPicker
