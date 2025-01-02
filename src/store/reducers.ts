import { combineSlices } from '@reduxjs/toolkit'
import { optimistic } from 'redux-optimistic-ui'

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

export interface LazyLoadedSlices {} // eslint-disable-line @typescript-eslint/no-empty-object-type

const combinedReducer = combineSlices({
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
}).withLazyLoadedSlices<LazyLoadedSlices>()

export default combinedReducer
