import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { clearErrorMessage, setFooterHeight, setHeaderHeight } from 'store/modules/ui'
import { ToastContainer } from 'react-toastify'

const CoreLayout = (props) => {
  const dispatch = useDispatch()
  const [header, setHeader] = React.useState(null)
  const headRef = React.useRef(null)
  const navRef = React.useRef(null)

  useObserver({
    callback: () => dispatch(setHeaderHeight(headRef.current?.clientHeight)),
    element: headRef,
  })

  useObserver({
    callback: () => dispatch(setFooterHeight(navRef.current?.clientHeight)),
    element: navRef,
  })

  const ui = useSelector(state => state.ui)
  const closeError = useCallback(() => dispatch(clearErrorMessage()), [dispatch])

  return (
    <>
      <Header customHeader={header} ref={headRef} />

      <Routes setHeader={setHeader} />

      <Navigation ref={navRef} />

      <SongInfo/>

      <Modal
        isVisible={ui.isErrored}
        onClose={closeError}
        title='Oops...'
        buttons=<button onClick={closeError}>OK</button>
      >
        <p>{ui.errorMessage}</p>
      </Modal>

      <ToastContainer />
    </>
  )
}

export default CoreLayout
