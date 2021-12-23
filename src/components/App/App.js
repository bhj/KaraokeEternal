import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'
import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import CoreLayout from './CoreLayout'
import Spinner from '../Spinner'
import history from 'lib/history'

const basename = new URL(document.baseURI).pathname

class App extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    persistor: PropTypes.object.isRequired,
  }

  render () {
    return (
      <Provider store={this.props.store}>
        <PersistGate loading={<Spinner/>} persistor={this.props.persistor}>
          <React.Suspense fallback={<Spinner/>}>
            <HistoryRouter history={history} basename={basename}>
              <CoreLayout />
            </HistoryRouter>
          </React.Suspense>
        </PersistGate>
      </Provider>
    )
  }
}

export default App
