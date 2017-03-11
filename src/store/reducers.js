import { combineReducers } from 'redux'
import { optimistic } from 'redux-optimistic-ui'
import { createResponsiveStateReducer } from 'redux-responsive'

// reducers
import location from './modules/location'
import ui from './modules/ui'
import status from './modules/status'
import user from './modules/user'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    browser: createResponsiveStateReducer(null, {
        extraFields: () => ({
            width: window.innerWidth,
            height: window.innerHeight,
        }),
    }),
    library,
    location,
    queue: optimistic(queue),
    status,
    ui,
    user,
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
