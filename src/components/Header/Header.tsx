import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { RootState } from 'store/store'
import { Routes, Route, useLocation } from 'react-router-dom'
import { createSelector } from '@reduxjs/toolkit'

import { requestScanStop } from 'store/modules/prefs'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import getWaits from 'routes/Queue/selectors/getWaits'
import LibraryHeader from 'routes/Library/components/LibraryHeader/LibraryHeaderContainer' // @todo
import PlaybackCtrl from './PlaybackCtrl/PlaybackCtrl'
import ProgressBar from './ProgressBar/ProgressBar'
import UpNext from './UpNext/UpNext'
import styles from './Header.css'

// selectors
const getIsAtQueueEnd = (state: RootState) => state.status.isAtQueueEnd
const getQueueId = (state: RootState) => state.status.queueId
const getUserId = (state: RootState) => state.user.userId

const getUserWait = createSelector(
  [getRoundRobinQueue, getQueueId, getUserId, getWaits],
  (queue, queueId, userId, waits) => {
    const curIdx = queue.result.indexOf(queueId)

    for (let i = curIdx + 1; i < queue.result.length; i++) {
      if (queue.entities[queue.result[i]].userId === userId) {
        return waits[queue.result[i]]
      }
    }
  }
)

const getStatusProps = createSelector(
  [getRoundRobinQueue, getQueueId, getIsAtQueueEnd, getUserId],
  (queue, queueId, isAtQueueEnd, userId) => {
    const { result, entities } = queue
    const curIdx = result.indexOf(queueId)
    const curItem = entities[queueId]

    return {
      isUpNext: result[curIdx + 1] ? entities[result[curIdx + 1]].userId === userId : false,
      isUpNow: curItem ? !isAtQueueEnd && curItem.userId === userId : false,
    }
  }
)

// component
const Header = React.forwardRef<HTMLDivElement, undefined>((_, ref) => {
  const isAdmin = useAppSelector(state => state.user.isAdmin)
  const isPlayerPresent = useAppSelector(state => state.status.isPlayerPresent)
  const isScanning = useAppSelector(state => state.prefs.isScanning)
  const scannerText = useAppSelector(state => state.prefs.scannerText)
  const scannerPct = useAppSelector(state => state.prefs.scannerPct)
  const { isUpNext, isUpNow } = useAppSelector(getStatusProps)
  const wait = useAppSelector(getUserWait)

  const location = useLocation()
  const isPlayer = location.pathname.replace(/\/$/, '').endsWith('/player')

  const dispatch = useAppDispatch()
  const cancelScan = useCallback(() => dispatch(requestScanStop()), [dispatch])

  return (
    <div className={`${styles.container} bg-blur`} ref={ref}>
      {!isPlayer && isPlayerPresent &&
        <UpNext isUpNext={isUpNext} isUpNow={isUpNow} wait={wait} />
      }

      {(isUpNow || isAdmin) &&
        <PlaybackCtrl />
      }

      {isAdmin && !isPlayer &&
        <ProgressBar
          isActive={isScanning}
          onCancel={cancelScan}
          pct={scannerPct}
          text={scannerText}
        />
      }

      <Routes>
        <Route path='/library' element={<LibraryHeader/>}/>
      </Routes>
    </div>
  )
})

Header.displayName = 'Header'

export default Header
