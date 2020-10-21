import { applyMiddleware, compose, createStore } from 'redux'
import createSocketMiddleware from './socketMiddleware'
import thunk from 'redux-thunk'
import createThrottle from 'redux-throttle'
import makeRootReducer from './reducers'
import { windowResize } from './modules/ui'

export default (initialState = {}) => {
  // resize action
  window.addEventListener('resize', () => store.dispatch(windowResize(window)))

  // ======================================================
  // Middleware Configuration
  // ======================================================
  const throttle = createThrottle(1000, {
    // https://lodash.com/docs#throttle
    leading: true,
    trailing: true,
  })

  const socketMiddleware = createSocketMiddleware(window._socket, 'server/')
  const middleware = [thunk, throttle, socketMiddleware]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = []
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

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  return store
}
