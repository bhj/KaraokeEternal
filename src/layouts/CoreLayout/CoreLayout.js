import PropTypes from 'prop-types'
import React from 'react'
// global stylesheets should be imported before any
// components that will import their own modular css
import 'normalize.css'
import '../../styles/global.css'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'

export const CoreLayout = (props) => {
  return (
    <>
      <Header/>

      {props.children}

      <Navigation/>

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
    </>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.any,
  errorMessage: PropTypes.any,
  // actions
  clearErrorMessage: PropTypes.func,
}
