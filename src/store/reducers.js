import { combineReducers } from 'redux'
import locationReducer from './location'
import account from 'routes/Account/modules/account'
import library from 'routes/Library/modules/library'
import queue from 'routes/Queue/modules/queue'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    location: locationReducer,
    account,
    library,
    queue,
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
