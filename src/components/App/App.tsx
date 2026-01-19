import React, { useEffect } from 'react'
import { Provider, useSelector } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import store, { RootState } from 'store/store'
import Persistor from 'store/Persistor'
import CoreLayout from './CoreLayout/CoreLayout'
import Spinner from '../Spinner/Spinner'

// Inner component that can use hooks to check bootstrap state
const AppContent = () => {
  const isBootstrapping = useSelector((state: RootState) => state.user.isBootstrapping)

  // Clean up roomId query param (room already assigned via SSO header auth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('roomId')) {
      params.delete('roomId')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  if (isBootstrapping) {
    return <Spinner />
  }

  return (
    <React.Suspense fallback={<Spinner />}>
      <CoreLayout />
    </React.Suspense>
  )
}

const App = () => (
  <Provider store={store}>
    <PersistGate loading={<Spinner />} persistor={Persistor.get()}>
      <AppContent />
    </PersistGate>
  </Provider>
)

export default App
