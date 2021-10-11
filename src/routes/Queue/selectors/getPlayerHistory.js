import { createSelector } from 'reselect'

const getPlayerHistoryJSON = (state) => state.status.historyJSON

const getPlayerHistory = createSelector(
  [getPlayerHistoryJSON],
  (history) => JSON.parse(history)
)

export default getPlayerHistory
