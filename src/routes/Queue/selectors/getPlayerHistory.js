import { createSelector } from '@reduxjs/toolkit'

const getPlayerHistoryJSON = (state) => state.status.historyJSON

const getPlayerHistory = createSelector(
  [getPlayerHistoryJSON],
  (history) => JSON.parse(history)
)

export default getPlayerHistory
