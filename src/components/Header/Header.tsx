import React from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { RootState } from 'store/store'
import { Routes, Route, useLocation } from 'react-router'
import { createSelector } from '@reduxjs/toolkit'

import { requestScanStop } from 'store/modules/prefs'
import getRoundRobinQueue from 'routes/Queue/selectors/getRoundRobinQueue'
import getDisplayQueue from 'routes/Queue/selectors/getDisplayQueue'
import getWaits from 'routes/Queue/selectors/getWaits'
import LibraryHeader from 'routes/Library/components/LibraryHeader/LibraryHeader'
import PlaybackCtrl from './PlaybackCtrl/PlaybackCtrl'
import ProgressBar from './ProgressBar/ProgressBar'
import UpNext from './UpNext/UpNext'
import styles from './Header.css'

// selectors
const getIsAtQueueEnd = (state: RootState) => state.status.isAtQueueEnd
const getQueueId = (state: RootState) => state.status.queueId
const getUserId = (state: RootState) => state.user.userId

// wait for the user's first upcoming row, including an in-flight provider song
const getUserWait = createSelector(
  [getDisplayQueue, getUserId, getWaits],
  (rows, userId, waits) => {
    for (const row of rows) {
      if (row.userId === userId && waits[row.key] !== undefined) {
        return waits[row.key]
      }
    }
  },
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
  },
)

// component
const Header = ({ ref }: { ref?: React.Ref<HTMLDivElement> }) => {
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
  const cancelScan = () => dispatch(requestScanStop())

  return (
    <div className={clsx(styles.container, 'bg-blur')} ref={ref}>
      {!isPlayer && isPlayerPresent
        && <UpNext isUpNext={isUpNext} isUpNow={isUpNow} wait={wait} />}

      {(isUpNow || isAdmin)
        && <PlaybackCtrl />}

      {isAdmin && !isPlayer
        && (
          <ProgressBar
            isActive={isScanning}
            onCancel={cancelScan}
            pct={scannerPct}
            text={scannerText}
          />
        )}

      <Routes>
        <Route path='/library' element={<LibraryHeader />} />
      </Routes>
    </div>
  )
}

export default Header
