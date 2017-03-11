import reduceReducers from 'reduce-reducers'
import userReducer from './user'
import starredSongReducer from './starredSongs'

// actions pass-through
import { loginUser, logoutUser, createUser, updateUser, fetchRooms } from './user'
import { toggleSongStarred } from './starredSongs'
export {
  loginUser,
  logoutUser,
  createUser,
  updateUser,
  fetchRooms,
  toggleSongStarred,
}

export default reduceReducers(
  userReducer,
  starredSongReducer,
)
