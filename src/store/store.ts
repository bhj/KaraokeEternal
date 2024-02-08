import { configureStore, ThunkAction, UnknownAction } from '@reduxjs/toolkit'
import reducers from './reducers'
import socket from 'lib/socket'
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

// resize action
window.addEventListener('resize', () => store.dispatch(windowResize({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
})))

// ======================================================
// Middleware Configuration
// ======================================================
const throttle = createThrottle(1000, {
  // https://lodash.com/docs#throttle
  leading: true,
  trailing: true,
})

const socketMiddleware = createSocketMiddleware(socket, 'server/')

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

// @todo: this doesn't handle dynamically injected (lazy-loaded) reducers
if (module.hot) {
  module.hot.accept('./reducers', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const combinedReducer = require('./reducers').default
    store.replaceReducer(combinedReducer)
  })
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// generic type for non-async thunks
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  UnknownAction
>

export default store
