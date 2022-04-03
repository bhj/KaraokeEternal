import PropTypes from 'prop-types'
import React from 'react'
import styles from './Logo.css'

const Logo = (props) => {
  return (
    <div className={`${styles.container} ${props.className}`}>
      <h1 className={styles.title}>
        Karaoke<span className={styles.eternal}>Eterna<span className={styles.lastChar}>l</span></span>
      </h1>
    </div>
  )
}

Logo.propTypes = {
  className: PropTypes.string,
}

export default Logo
