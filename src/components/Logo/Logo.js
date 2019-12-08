import PropTypes from 'prop-types'
import React from 'react'
import LogoImage from 'assets/app.png'
import './Logo.css'

const Logo = (props) => {
  return (
    <div styleName='container' className={props.className}>
      <img src={LogoImage} alt='microphone' styleName='imgMic'/>
      <h1 styleName='title'>
        Karaoke<span styleName='forever'>Forever</span>
      </h1>
    </div>
  )
}

Logo.propTypes = {
  className: PropTypes.string,
}

export default Logo
