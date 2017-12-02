import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { browserHistory, Router } from 'react-router'
import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/es/integration/react'

class AppContainer extends Component {
  static propTypes = {
    routes : PropTypes.object.isRequired,
    store  : PropTypes.object.isRequired
  }

  componentWillMount () {
    const { store } = this.props

    // begin periodically persisting the store
    window._persistor = persistStore(store, null, () => {
      // if it looks like we have/had a valid session
      if (store.getState().user.userId !== null) {
        window._socket.open()
      }
    })
  }

  render () {
    const { routes, store } = this.props

    return (
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={window._persistor}
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
