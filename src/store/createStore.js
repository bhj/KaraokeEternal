import { applyMiddleware, compose, createStore } from 'redux'
import createOptimisticMiddleware from './optimisticMiddleware'
import thunk from 'redux-thunk'
import createThrottle from "redux-throttle"
import { browserHistory } from 'react-router'
import makeRootReducer from './reducers'
import { updateLocation } from './location'
import { responsiveStoreEnhancer } from 'redux-responsive'

export default (initialState = {}, socket) => {
  // ======================================================
  // Middleware Configuration
  // ======================================================
  const throttle = createThrottle(1000, {
    // https://lodash.com/docs#throttle
    leading: true,
    trailing: true
  })
  const optimisticMiddleware = createOptimisticMiddleware(socket, "server/")

  const middleware = [thunk, throttle, optimisticMiddleware]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = [
    responsiveStoreEnhancer,
  ]

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

  return store
}
