import { RootState } from 'store/store'
import { createSelector } from '@reduxjs/toolkit'
import type { ProviderFetchRequester, ProviderFetchView } from '../../Library/modules/library'

const getProviderFetches = (state: RootState) => state.library.providerFetches

const VISIBLE_STATUSES = new Set<ProviderFetchView['status']>(['pending', 'downloading', 'error'])

// one row per requester: the fetch's state plus who is waiting on it
export interface PendingQueueItem extends Omit<ProviderFetchView, 'requests'>, ProviderFetchRequester {
  key: string
}

// oldest request first; getDisplayQueue places them in the queue
const getPendingQueue = createSelector(
  [getProviderFetches],
  (providerFetches): PendingQueueItem[] => {
    const items: PendingQueueItem[] = []
    for (const { requests, ...view } of Object.values(providerFetches)) {
      if (!VISIBLE_STATUSES.has(view.status)) continue
      for (const requester of requests) {
        items.push({ ...view, ...requester, key: `pending-${view.providerId}-${view.itemId}-${requester.userId}` })
      }
    }

    return items.sort((a, b) => a.timestamp - b.timestamp)
  },
)

export default getPendingQueue
