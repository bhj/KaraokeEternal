import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import store from 'store/store'
import Persistor from 'store/Persistor'
import CoreLayout from './CoreLayout/CoreLayout'
import Spinner from '../Spinner/Spinner'

const App = () => (
  <Provider store={store}>
    <PersistGate loading={<Spinner />} persistor={Persistor.get()}>
      <React.Suspense fallback={<Spinner />}>
        <CoreLayout />
      </React.Suspense>
    </PersistGate>
  </Provider>
)

export default App
