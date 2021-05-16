import PropTypes from 'prop-types'
import React from 'react'
import styles from './TextOverlay.css'

export const TextOverlay = props => (
  <div className={styles.container}>
    <div className={`${styles.text} ${props.className}`}>
      {props.children}
    </div>
  </div>
)

export default TextOverlay

TextOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}
