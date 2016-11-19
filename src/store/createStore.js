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

  if (__DEV__) {
    const devToolsExtension = window.devToolsExtension
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension())
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    compose(
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
