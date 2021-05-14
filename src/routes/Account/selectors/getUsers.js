import { createSelector } from 'reselect'

const getResult = (state) => state.users.result
const getEntities = (state) => state.users.entities
const getFilterOnline = (state) => state.users.filterOnline
const getFilterRoomId = (state) => state.users.filterRoomId

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
