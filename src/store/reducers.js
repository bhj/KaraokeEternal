import { combineReducers } from 'redux'
import { optimistic } from 'redux-optimistic-ui'

// reducers
import artists from 'routes/Library/modules/artists'
import library from 'routes/Library/modules/library'
import prefs from './modules/prefs'
import queue from 'routes/Queue/modules/queue'
import rooms from './modules/rooms'
import songs from 'routes/Library/modules/songs'
import songInfo from './modules/songInfo'
import starCounts from 'routes/Library/modules/starCounts'
import status from './modules/status'
import ui from './modules/ui'
import user from './modules/user'
import userStars from './modules/userStars'

export const makeRootReducer = (asyncReducers) => {
  return combineReducers({
    artists,
    library,
    prefs,
    queue: optimistic(queue),
    rooms,
    songs,
    songInfo,
    starCounts,
    status,
    ui,
    user,
    userStars: optimistic(userStars),
    ...asyncReducers,
  })
}

export const injectReducer = (store, { key, reducer }) => {
  if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

  store.asyncReducers[key] = reducer
  store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
