import { RootState } from 'store/store'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import getPlayerHistory from './getPlayerHistory'
import getDisplayQueue from './getDisplayQueue'

const getEntities = (state: RootState) => ensureState(state.queue).entities
const getPosition = (state: RootState) => state.status.position
const getQueueId = (state: RootState) => state.status.queueId
const getSongs = (state: RootState) => state.songs

// Seconds until each upcoming row's turn, keyed by DisplayRow key. Errs low,
// so singers are ready when they're up: a pending song only adds its length
// when the provider expects it to be ready by its turn, since otherwise the
// player skips past it.
const getWaits = createSelector(
  [getDisplayQueue, getEntities, getQueueId, getPlayerHistory, getPosition, getSongs],
  (rows, entities, curId, history, position, songs) => {
    const waits: Record<string, number> = {}
    let wait = 0

    for (const row of rows) {
      if (row.kind === 'pending') {
        if (row.item.status === 'error') continue
        waits[row.key] = wait

        const { duration, eta } = row.item
        if (duration !== undefined && eta !== undefined && eta <= wait) wait += duration
        continue
      }

      const song = songs.entities[entities[row.queueId].songId]
      if (!song) continue

      if (row.queueId === curId) {
        // if history includes the current item it's already been played
        if (!history.includes(curId)) wait += Math.max(0, Math.round(song.duration - position))
        continue
      }

      if (history.includes(row.queueId)) continue // played

      waits[row.key] = wait
      wait += song.duration
    }

    return waits
  },
)

export default getWaits
