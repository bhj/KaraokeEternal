import { combineReducers } from 'redux'
import { createResponsiveStateReducer } from 'redux-responsive'

// reducers
import library from 'routes/Library/modules/library'
import location from './modules/location'
import queue from 'routes/Queue/modules/queue'
import room from './modules/room'
import ui from './modules/ui'
import user from './modules/user'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    library,
    location,
    queue,
    room,
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
