import PropTypes from 'prop-types'
import React from 'react'
// global stylesheets should be imported before any
// components that will import their own modular css
import 'normalize.css'
import '../../../styles/global.css'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import Modal from 'components/Modal'
import SongInfo from 'components/SongInfo'
import useObserver from 'lib/useObserver'
import Routes from '../Routes'

const CoreLayout = (props) => {
  const [header, setHeader] = React.useState(null)
  const headRef = React.useRef(null)
  const navRef = React.useRef(null)

  useObserver({
    callback: () => props.setHeaderHeight(headRef.current?.clientHeight),
    element: headRef,
  })

  useObserver({
    callback: () => props.setFooterHeight(navRef.current?.clientHeight),
    element: navRef,
  })

  return (
    <>
      <Header customHeader={header} ref={headRef} />

      <Routes setHeader={setHeader} />

      <Navigation ref={navRef} />

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

CoreLayout.propTypes = {
  ui: PropTypes.object.isRequired,
  // actions
  clearErrorMessage: PropTypes.func.isRequired,
  closeSongInfo: PropTypes.func.isRequired,
  setFooterHeight: PropTypes.func.isRequired,
  setHeaderHeight: PropTypes.func.isRequired,
}

export default CoreLayout
