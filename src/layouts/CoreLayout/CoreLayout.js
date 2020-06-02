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
      {React.cloneElement(props.children, {
        browserWidth: props.ui.innerWidth,
        browserHeight: props.ui.innerHeight,
        contentWidth: props.ui.contentWidth,
        headerHeight: props.ui.headerHeight,
        footerHeight: props.ui.footerHeight,
      })}

      {props.isLoggedIn &&
        <Navigation/>
      }

      <SkyLightStateless
        isVisible={typeof props.songInfoId === 'number'}
        onCloseClicked={props.closeSongInfo}
        onOverlayClicked={props.closeSongInfo}
        title={'Song Info'}
        dialogStyles={{
          width: '90%',
          height: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
          overflow: 'auto',
          userSelect: 'text'
        }}
      >
        <SongInfo songId={props.songInfoId}/>
      </SkyLightStateless>

      <SkyLightStateless
        isVisible={props.ui.errorMessage !== null}
        onCloseClicked={props.clearErrorMessage}
        onOverlayClicked={props.clearErrorMessage}
        title='Oops'
        dialogStyles={{
          width: '80%',
          minHeight: '200px',
          left: '10%',
          marginLeft: '0',
          userSelect: 'text'
        }}
      >
        <p>{props.ui.errorMessage}</p>
        <br /><br /><br />
        <button onClick={props.clearErrorMessage}>OK</button>
      </SkyLightStateless>
    </>
  )
}

export default CoreLayout

CoreLayout.propTypes = {
  children: PropTypes.any,
  isLoggedIn: PropTypes.bool,
  songInfoId: PropTypes.number,
  ui: PropTypes.object.isRequired,
  // actions
  clearErrorMessage: PropTypes.func.isRequired,
  closeSongInfo: PropTypes.func.isRequired,
}
