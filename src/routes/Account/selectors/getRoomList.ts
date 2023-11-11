import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'

const getResult = (state: RootState) => state.rooms.result
const getEntities = (state: RootState) => state.rooms.entities
const getFilterStatus = (state: RootState) => state.rooms.filterStatus

const getRoomList = createSelector(
  [getResult, getEntities, getFilterStatus],
  (result, entities, status) => ({
    result: result.filter(roomId => status === false || entities[roomId].status === status),
    entities,
  }))

export default getRoomList
