import { combineReducers } from 'redux'
import { optimistic } from 'redux-optimistic-ui';
import { createResponsiveStateReducer } from 'redux-responsive'

// reducers
import location from './location'
import ui from './ui'
import account from 'routes/Account/modules/account'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'
import player from 'routes/Player/modules/player'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    browser: createResponsiveStateReducer(null, {
        extraFields: () => ({
            width: window.innerWidth,
            height: window.innerHeight,
        }),
    }),
    location,
    ui,
    account,
    library,
    queue: optimistic(queue),
    player,
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
