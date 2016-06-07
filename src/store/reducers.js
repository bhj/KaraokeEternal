import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import userReducer from './user'
import searchReducer from 'routes/Library/routes/Search/modules/search'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    // Add sync reducers here
    router,
    user: userReducer,
    search: searchReducer,
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
