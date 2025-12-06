import React, { useCallback, useRef } from 'react'
import { useMatch } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import useResizeObserver from 'use-resize-observer'
// global stylesheets should be imported before any
// components that will import their own modular css
import '../../../styles/global.css'
import Button from 'components/Button/Button'
import Header from 'components/Header/Header'
import Navigation from 'components/Navigation/Navigation'
import Modal from 'components/Modal/Modal'
import SongInfo from 'components/SongInfo/SongInfo'
import Routes from '../Routes/Routes'
import { clearErrorMessage, setFooterHeight, setHeaderHeight } from 'store/modules/ui'

const CoreLayout = () => {
  const isPlayerRoute = useMatch('/player')
  const dispatch = useAppDispatch()
  const headerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useResizeObserver({
    onResize: ({ height }) => { dispatch(setHeaderHeight(height)) },
    ref: headerRef,
  })

  useResizeObserver({
    onResize: ({ height }) => { dispatch(setFooterHeight(height)) },
    ref: navRef,
  })

  const ui = useAppSelector(state => state.ui)
  const closeError = useCallback(() => dispatch(clearErrorMessage()), [dispatch])

  return (
    <>
      <Header ref={headerRef} />

      <Routes />

      {!isPlayerRoute && <Navigation ref={navRef} />}

      <SongInfo />

      {ui.isErrored && (
        <Modal
          title='Oops...'
          onClose={closeError}
          buttons={<Button variant='primary' onClick={closeError}>OK</Button>}
        >
          <p style={{ WebkitUserSelect: 'text', userSelect: 'text' }}>
            {ui.errorMessage}
          </p>
        </Modal>
      )}
    </>
  )
}

export default CoreLayout
