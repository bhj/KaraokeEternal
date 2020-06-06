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

      <SongInfo/>

      <Modal
        isVisible={props.ui.isErrored}
        onClose={props.clearErrorMessage}
        title='Oops...'
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
  ui: PropTypes.object.isRequired,
  // actions
  clearErrorMessage: PropTypes.func.isRequired,
  closeSongInfo: PropTypes.func.isRequired,
}
