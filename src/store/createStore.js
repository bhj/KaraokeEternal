import { applyMiddleware, compose, createStore } from 'redux'
import createSocketMiddleware from './socketMiddleware'
import thunk from 'redux-thunk'
import createThrottle from "redux-throttle"
import { browserHistory } from 'react-router'
import makeRootReducer from './reducers'
import { updateLocation } from './modules/location'
import { responsiveStoreEnhancer, calculateResponsiveState } from 'redux-responsive'
import { persistStore, autoRehydrate } from 'redux-persist'
import io from 'socket.io-client'

export default (initialState = {}) => {
  // the "socket" side of the api requires authentication, so
  // we only want to attempt socket connection if we think we
  // have (or just received) a JWT set via http cookie on login.
  // socket.io handshake will then contain the JWT
  window._socket = io({autoConnect: false})

  // ======================================================
  // Middleware Configuration
  // ======================================================
  const throttle = createThrottle(1000, {
    // https://lodash.com/docs#throttle
    leading: true,
    trailing: true
  })

  const socketMiddleware = createSocketMiddleware(window._socket, "server/")

  const middleware = [thunk, throttle, socketMiddleware]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = [
    responsiveStoreEnhancer,
    autoRehydrate(),
  ]

  window.addEventListener('resize', () => store.dispatch(calculateResponsiveState(window)))

  let composeEnhancers = compose

  if (__DEV__) {
    const composeWithDevToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    if (typeof composeWithDevToolsExtension === 'function') {
      composeEnhancers = composeWithDevToolsExtension
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    composeEnhancers(
      applyMiddleware(...middleware),
      ...enhancers
    )
  )
  store.asyncReducers = {}

  // To unsubscribe, invoke `store.unsubscribeHistory()` anytime
  store.unsubscribeHistory = browserHistory.listen(updateLocation(store))

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  // begin periodically persisting the store
  persistStore(store, {whitelist: ['user']}, () => {
    // on rehydrate, attempt socket.io connection
    // if it looks like we have a valid session
    if (store.getState().user.userId !== null) {
      window._socket.open()
    }
  })

  return store
}
