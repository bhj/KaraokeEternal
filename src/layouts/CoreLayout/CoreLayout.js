import PropTypes from 'prop-types'
import React from 'react'
// global stylesheets should be imported before any
// components that will import their own modular css
import 'normalize.css'
import '../../styles/global.css'
import Navigation from 'components/Navigation'
import { SkyLightStateless } from 'react-skylight'
import SongInfo from 'components/SongInfo'

export const CoreLayout = (props) => {
  return (
    <>
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

      <SkyLightStateless
        isVisible={props.isSongInfoOpen}
        onCloseClicked={props.closeSongInfo}
        onOverlayClicked={props.closeSongInfo}
        title={'Song Details'}
        dialogStyles={{
          width: '90%',
          height: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
          overflow: 'auto',
        }}
      >
        <SongInfo />
      </SkyLightStateless>
    </>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.any,
  errorMessage: PropTypes.any,
  isSongInfoOpen: PropTypes.bool.isRequired,
  // actions
  clearErrorMessage: PropTypes.func.isRequired,
  closeSongInfo: PropTypes.func.isRequired,
}
