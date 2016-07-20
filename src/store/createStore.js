import { applyMiddleware, compose, createStore } from 'redux'
import { routerMiddleware } from 'react-router-redux'
import createSocketIoMiddleware from 'redux-socket.io'
import thunk from 'redux-thunk'
import makeRootReducer from './reducers'

export default (initialState = {}, history, socket) => {
  // ======================================================
  // Middleware Configuration
  // ======================================================
  let socketIoMiddleware = createSocketIoMiddleware(socket, "server/")

  const middleware = [thunk, routerMiddleware(history), socketIoMiddleware]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = []
  if (__DEBUG__) {
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

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      const reducers = require('./reducers').default
      store.replaceReducer(reducers(store.asyncReducers))
    })
  }

  return store
}
