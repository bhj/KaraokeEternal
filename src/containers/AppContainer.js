import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { browserHistory, Router } from 'react-router'
import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'

class AppContainer extends Component {
  static propTypes = {
    routes : PropTypes.object.isRequired,
    store  : PropTypes.object.isRequired
  }

  constructor (props) {
    super(props)
    this.state = { rehydrated: false }
  }

  componentWillMount () {
    const { store } = this.props

    // begin periodically persisting the store
    persistStore(store, { whitelist: ['user'] }, () => {
      this.setState({ rehydrated: true })

      // if it looks like we have/had a valid session
      if (store.getState().user.userId !== null) {
        window._socket.open()
      }
    })
  }

  render () {
    const { routes, store } = this.props

    if (!this.state.rehydrated) {
      return (<div>Loading...</div>)
    }

    return (
      <Provider store={store}>
        <div style={{ height: '100%' }}>
          <Router history={browserHistory} children={routes} />
        </div>
      </Provider>
    )
  }
}

export default AppContainer
