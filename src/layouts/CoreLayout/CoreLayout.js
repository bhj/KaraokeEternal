import PropTypes from 'prop-types'
import React from 'react'
// global stylesheets should be imported before any
// components that will import their own modular css
import 'normalize.css'
import '../../styles/global.css'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'

export const CoreLayout = (props) => {
  const ui = {
    browserWidth: props.browserWidth,
    browserHeight: props.browserHeight,
    headerHeight: props.headerHeight,
    footerHeight: props.footerHeight,
    viewportWidth: props.browserWidth,
    viewportHeight: props.browserHeight - props.headerHeight - props.footerHeight,
  }

  return (
    <div>
      { React.cloneElement(props.children, { ui }) }

      <Navigation />

      <SkyLightStateless
        isVisible={props.errorMessage !== null}
        onCloseClicked={props.clearErrorMessage}
        onOverlayClicked={props.clearErrorMessage}
        title='Oops'
        dialogStyles={{
          width: '80%',
          minHeight: '200px',
          left: '10%',
          marginLeft: '0' }}
      >
        <p>{props.errorMessage}</p>
        <br /><br /><br />
        <button onClick={props.clearErrorMessage}>OK</button>
      </SkyLightStateless>
    </div>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.any,
  browserWidth: PropTypes.number.isRequired,
  browserHeight: PropTypes.number.isRequired,
  headerHeight: PropTypes.number.isRequired,
  footerHeight: PropTypes.number.isRequired,
  errorMessage: PropTypes.any,
  // actions
  clearErrorMessage: PropTypes.func,
}
