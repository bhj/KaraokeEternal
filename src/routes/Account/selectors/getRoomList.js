import { createSelector } from 'reselect'

const getResult = (state) => state.rooms.result
const getEntities = (state) => state.rooms.entities
const getFilterStatus = (state) => state.rooms.filterStatus

const getRoomList = createSelector(
  [getResult, getEntities, getFilterStatus],
  (result, entities, status) => ({
    result: result.filter(roomId => status === false || entities[roomId].status === status),
    entities,
  }))

export default getRoomList
