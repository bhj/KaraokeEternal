import { combineReducers, configureStore } from '@reduxjs/toolkit'
import reducers from './reducers'
import createSocketMiddleware from './socketMiddleware'
import createThrottle from 'redux-throttle'
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import { windowResize } from './modules/ui'
import io from 'socket.io-client'

// the "socket" side of the api requires authentication, so
// we only want to attempt socket connection if we think we
// have a valid session (via JWT in cookie). the socket.io
// handshake (http) will then include the JWT/cookie
window._socket = io({
  autoConnect: false,
  path: new URL(document.baseURI).pathname + 'socket.io',
})

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

// ======================================================
// Store Instantiation and HMR Setup
// ======================================================
const store = configureStore({
  reducer: reducers,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    // https://redux-toolkit.js.org/usage/usage-guide#use-with-redux-persist
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }).concat(throttle, socketMiddleware),
})

store.asyncReducers = {}

if (module.hot) {
  module.hot.accept('./reducers', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const reducers = require('./reducers').default

    store.replaceReducer(combineReducers({
      ...reducers,
      ...store.asyncReducers,
    }))
  })
}

export const injectReducer = ({ key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(combineReducers({
    ...reducers,
    ...store.asyncReducers,
  }))
}

export default store
