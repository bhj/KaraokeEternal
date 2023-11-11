import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'

const getResult = (state: RootState) => state.users.result
const getEntities = (state: RootState) => state.users.entities
const getFilterOnline = (state: RootState) => state.users.filterOnline
const getFilterRoomId = (state: RootState) => state.users.filterRoomId

const getUsers = createSelector(
  [getResult, getEntities, getFilterOnline, getFilterRoomId],
  (result, entities, filterOnline, filterRoomId) => {
    if (filterOnline) {
      result = result.filter(userId => entities[userId].rooms.length)
    } else if (typeof filterRoomId === 'number') {
      result = result.filter(userId => entities[userId].rooms.includes(filterRoomId))
    }

    return {
      result,
      entities,
    }
  })

export default getUsers
