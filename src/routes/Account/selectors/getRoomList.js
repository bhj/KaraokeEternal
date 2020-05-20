import { createSelector } from 'reselect'

const getResult = (state) => state.rooms.result
const getEntities = (state) => state.rooms.entities
const getShowAll = (state) => state.rooms.isShowingAll

const getRoomList = createSelector(
  [getResult, getEntities, getShowAll],
  (result, entities, isShowingAll) => ({
    result: result.filter(roomId => entities[roomId].status === 'open' || isShowingAll),
    entities,
  }))

export default getRoomList
