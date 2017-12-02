import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { browserHistory, Router } from 'react-router'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/es/integration/react'

class AppContainer extends Component {
  static propTypes = {
    routes: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    persistor: PropTypes.object.isRequired,
  }

  render () {
    const { routes, store, persistor } = this.props

    return (
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
        >
          <div style={{ height: '100%' }}>
            <Router history={browserHistory} children={routes} />
          </div>
        </PersistGate>
      </Provider>
    )
  }
}

export default AppContainer
