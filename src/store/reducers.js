import { optimistic } from 'redux-optimistic-ui'
import { persistCombineReducers } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { createResponsiveStateReducer } from 'redux-responsive'

// reducers
import artists from './modules/artists'
import library from 'routes/Library/modules/library'
import location from './modules/location'
import prefs from './modules/prefs'
import queue from 'routes/Queue/modules/queue'
import rooms from './modules/rooms'
import songs from './modules/songs'
import status from './modules/status'
import ui from './modules/ui'
import user from './modules/user'

const persistConfig = {
  key: 'primary',
  whitelist: ['user'],
  storage,
}

export const makeRootReducer = (asyncReducers) => {
  return persistCombineReducers(persistConfig, {
    artists,
    browser: createResponsiveStateReducer(),
    library,
    location,
    prefs,
    queue: optimistic(queue),
    rooms,
    songs,
    status,
    ui,
    user,
    ...asyncReducers,
  })
}

export const injectReducer = (store, { key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
