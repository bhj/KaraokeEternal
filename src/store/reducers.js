import { combineReducers } from 'redux'
import { optimistic } from 'redux-optimistic-ui';
import locationReducer from './location'
import account from 'routes/Account/modules/account'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'
import player from 'routes/Player/modules/player'

export const makeRootReducer = (asyncReducers) => {
  return optimistic(combineReducers({
    location: locationReducer,
    errorMessage,
    account,
    library,
    queue,
    player,
    ...asyncReducers
  }))
}

export const injectReducer = (store, { key, reducer }) => {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer

export const CLEAR_ERROR_MESSAGE = 'CLEAR_ERROR_MESSAGE'

function errorMessage(state = null, action) {
  const { type, error } = action

  if (type === CLEAR_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return action.error
  }

  return state
}

export function clearErrorMessage() {
  return {
    type: CLEAR_ERROR_MESSAGE,
    payload: null,
  }
}
