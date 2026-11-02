import React, { useState } from 'react'
import { useMatch } from 'react-router'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import useResizeObserver from 'lib/useResizeObserver'
// global stylesheets should be imported before any
// components that will import their own modular css
import '../../../styles/global.css'
import Button from 'components/Button/Button'
import Header from 'components/Header/Header'
import Navigation from 'components/Navigation/Navigation'
import Modal from 'components/Modal/Modal'
import ProviderInfoHost from 'components/ProviderInfo/ProviderInfoHost'
import SongInfo from 'components/SongInfo/SongInfo'
import Spinner from 'components/Spinner/Spinner'
import Routes from '../Routes/Routes'
import { clearErrorMessage, setFooterHeight, setHeaderHeight } from 'store/modules/ui'

const CoreLayout = () => {
  const isPlayerRoute = useMatch('/player')
  const dispatch = useAppDispatch()
  const isSignedIn = useAppSelector(state => state.user.userId !== null)
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null)
  const [navEl, setNavEl] = useState<HTMLDivElement | null>(null)

  useResizeObserver({
    onResize: ({ height }) => { dispatch(setHeaderHeight(height)) },
    element: headerEl,
  })

  useResizeObserver({
    onResize: ({ height }) => { dispatch(setFooterHeight(height)) },
    element: navEl,
  })

  const ui = useAppSelector(state => state.ui)
  const closeError = () => dispatch(clearErrorMessage())

  return (
    <ProviderInfoHost>
      <Header ref={setHeaderEl} />

      <React.Suspense fallback={<Spinner />}>
        <Routes />
      </React.Suspense>

      {isSignedIn && !isPlayerRoute && <Navigation ref={setNavEl} />}

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
    </ProviderInfoHost>
  )
}

export default CoreLayout
