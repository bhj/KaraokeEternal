import { combineReducers } from 'redux'
import { optimistic } from 'redux-optimistic-ui';
import locationReducer from './location'
import account from 'routes/Account/modules/account'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'

export const makeRootReducer = (asyncReducers) => {
  return optimistic(combineReducers({
    location: locationReducer,
    errorMessage,
    account,
    library,
    queue,
    ...asyncReducers
  }))
}

export const injectReducer = (store, { key, reducer }) => {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer

export const RESET_ERROR_MESSAGE = 'RESET_ERROR_MESSAGE'

function errorMessage(state = null, action) {
  const { type, error } = action

  if (type === RESET_ERROR_MESSAGE) {
    return null
  } else if (error) {
    return action.error
  }

  return state
}
