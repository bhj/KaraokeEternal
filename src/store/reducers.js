import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import userReducer from './user'
import artistsReducer from 'routes/Library/routes/Artists/modules/artists'
import songReducer from 'routes/Library/routes/Songs/modules/songs'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    // Add sync reducers here
    router,
    user: userReducer,
    artists: artistsReducer,
    songs: songReducer,
    ...asyncReducers
  })
}

export const injectReducer = (store, { key, reducer }) => {
  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
