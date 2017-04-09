import { combineReducers } from 'redux'
import { createResponsiveStateReducer } from 'redux-responsive'

// reducers
import artists from './modules/artists'
import location from './modules/location'
import ui from './modules/ui'
import status from './modules/status'
import user from './modules/user'
import songs from './modules/songs'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    artists,
    songs,
    library,
    location,
    queue,
    status,
    ui,
    user,
    viewport: createResponsiveStateReducer(null, {
      extraFields: () => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    }),
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
