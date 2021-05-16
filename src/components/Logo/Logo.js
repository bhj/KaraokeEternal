import PropTypes from 'prop-types'
import React from 'react'
import LogoImage from 'assets/app.png'
import styles from './Logo.css'

const Logo = (props) => {
  return (
    <div className={`${styles.container} ${props.className}`}>
      <img src={LogoImage} alt='microphone' className={styles.imgMic}/>
      <h1 className={styles.title}>
        Karaoke<span className={styles.forever}>Forever</span>
      </h1>
    </div>
  )
}

Logo.propTypes = {
  className: PropTypes.string,
}

export default Logo
