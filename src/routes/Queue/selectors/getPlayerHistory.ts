import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'

const getPlayerHistoryJSON = (state: RootState) => state.status.historyJSON

const getPlayerHistory = createSelector(
  [getPlayerHistoryJSON],
  history => JSON.parse(history) as number[],
)

export default getPlayerHistory
