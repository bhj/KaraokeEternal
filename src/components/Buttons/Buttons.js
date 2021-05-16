import React from 'react'
import PropTypes from 'prop-types'
import styles from './Buttons.css'

export default class Buttons extends React.Component {
  static propTypes = {
    btnWidth: PropTypes.number.isRequired,
    className: PropTypes.string,
    children: PropTypes.any,
    isExpanded: PropTypes.bool.isRequired,
  }

  render () {
    let visible = 0

    const children = React.Children.map(this.props.children, (c, i) => {
      if (React.isValidElement(c)) {
        if (c.props['data-hide'] && !this.props.isExpanded) {
          return React.cloneElement(c, {
            className: c.props.className + ' ' + styles.btnHide,
          })
        }

        visible++
        return c
      }
    })

    return (
      <div className={`${styles.container} ${this.props.className}`}
        style={{ width: this.props.btnWidth * visible }}>
        {children}
      </div>
    )
  }
}
