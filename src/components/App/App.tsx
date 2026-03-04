import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import store from 'store/store'
import Persistor from 'store/Persistor'
import I18nProvider from 'i18n/I18nProvider'
import CoreLayout from './CoreLayout/CoreLayout'
import Spinner from '../Spinner/Spinner'

const App = () => (
  <I18nProvider>
    <Provider store={store}>
      <PersistGate loading={<Spinner />} persistor={Persistor.get()}>
        <React.Suspense fallback={<Spinner />}>
          <CoreLayout />
        </React.Suspense>
      </PersistGate>
    </Provider>
  </I18nProvider>
)

export default App
