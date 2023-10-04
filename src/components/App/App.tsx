import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import CoreLayout from './CoreLayout'
import Spinner from '../Spinner'

interface AppProps {
  store: object
  persistor: object
}

class App extends Component<AppProps> {
  render () {
    return (
      <Provider store={this.props.store}>
        <PersistGate loading={<Spinner/>} persistor={this.props.persistor}>
          <React.Suspense fallback={<Spinner/>}>
            <CoreLayout />
          </React.Suspense>
        </PersistGate>
      </Provider>
    )
  }
}

export default App
