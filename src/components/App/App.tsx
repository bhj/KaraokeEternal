import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import store from 'store/store'
import Persistor from 'store/Persistor'
import CoreLayout from './CoreLayout'
import Spinner from '../Spinner'

class App extends Component {
  render () {
    return (
      <Provider store={store}>
        <PersistGate loading={<Spinner/>} persistor={Persistor.get()}>
          <React.Suspense fallback={<Spinner/>}>
            <CoreLayout />
          </React.Suspense>
        </PersistGate>
      </Provider>
    )
  }
}

export default App
