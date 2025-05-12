import React from 'react'
import clsx from 'clsx'
import styles from './Buttons.css'

interface ButtonsProps {
  btnWidth: number
  className?: string
  children?: React.ReactNode
  isExpanded: boolean
}

export default class Buttons extends React.Component<ButtonsProps> {
  render () {
    let visible = 0

    const children = React.Children.map(this.props.children, (c) => {
      if (React.isValidElement<{ className: string }>(c)) {
        if (c.props['data-hide'] && !this.props.isExpanded) {
          return React.cloneElement(c, {
            className: clsx(c.props.className, styles.btnHide),
          })
        }

        visible++
        return c
      }
    })

    return (
      <div
        className={clsx(styles.container, this.props.className)}
        style={{ width: this.props.btnWidth * visible }}
      >
        {children}
      </div>
    )
  }
}
