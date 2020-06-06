import PropTypes from 'prop-types'
import React from 'react'
// global stylesheets should be imported before any
// components that will import their own modular css
import 'normalize.css'
import '../../styles/global.css'
import Navigation from 'components/Navigation'
import Modal from 'components/Modal'
import SongInfo from 'components/SongInfo'

export const CoreLayout = (props) => {
  return (
    <>
      {props.children}

      {props.isLoggedIn &&
        <Navigation/>
      }

      <Modal
        isVisible={typeof props.songInfoId === 'number'}
        onClose={props.closeSongInfo}
        title='Song Info'
        buttons=<button onClick={props.closeSongInfo}>Done</button>
        style={{ width: '100%', height: '100%' }}
      >
        <SongInfo songId={props.songInfoId}/>
      </Modal>

      <Modal
        isVisible={props.ui.errorMessage !== null}
        onClose={props.clearErrorMessage}
        title='Oops'
        buttons=<button onClick={props.clearErrorMessage}>OK</button>
      >
        <p>{props.ui.errorMessage}</p>
      </Modal>
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
