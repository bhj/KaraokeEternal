import React, { useState } from 'react'
import clsx from 'clsx'
import { useSwipeable } from 'react-swipeable'
import Button from 'components/Button/Button'
import Buttons from 'components/Buttons/Buttons'
import UserImage from 'components/UserImage/UserImage'
import ProviderFetchStatusIndicator from 'components/ProviderFetchStatus/ProviderFetchStatus'
import { useAppDispatch } from 'store/hooks'
import { showErrorMessage } from 'store/modules/ui'
import { useProviderInfo } from 'components/ProviderInfo/ProviderInfoContext'
import type { ProviderFetchStatus } from '../../../Library/modules/library'
import styles from './ProviderQueueItem.css'

interface ProviderQueueItemProps {
  providerId: number
  itemId: string
  title: string
  artist: string
  source?: string
  iconUrl?: string
  status: ProviderFetchStatus
  progress: number
  error?: string
  userId: number
  userDisplayName: string
  userDateUpdated: number
  wait?: string
  isAdmin: boolean
  isOwner: boolean
  isCancelable: boolean
  isRetryable: boolean
  onCancel: (providerId: number, itemId: string, userId: number) => void
  onRetry: () => void
}

const ProviderQueueItem = ({
  providerId,
  itemId,
  title,
  artist,
  source,
  iconUrl,
  status,
  progress,
  error,
  userId,
  userDateUpdated,
  userDisplayName,
  wait,
  isAdmin,
  isOwner,
  isCancelable,
  isRetryable,
  onCancel,
  onRetry,
}: ProviderQueueItemProps) => {
  const dispatch = useAppDispatch()
  const showProviderInfo = useProviderInfo()
  const [expanded, setExpanded] = useState(false)

  const handleCancelClick = () => {
    onCancel(providerId, itemId, userId)
    setExpanded(false)
  }
  const handleRetryClick = () => {
    onRetry()
    setExpanded(false)
  }
  const handleErrorInfoClick = () => dispatch(showErrorMessage(error ?? 'Unknown error'))
  const handleInfoClick = () => showProviderInfo({
    providerId,
    itemId,
    title,
    artist,
    source,
    status,
    error,
  })

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setExpanded(isAdmin || isCancelable || isRetryable),
    onSwipedRight: () => setExpanded(false),
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div {...swipeHandlers} className={clsx(styles.container, status === 'error' && styles.errored)}>
      <div className={styles.content}>
        <div className={styles.imageContainer}>
          <UserImage userId={userId} dateUpdated={userDateUpdated} />
          {status !== 'error' && (
            <div className={styles.statusOverlay}>
              <ProviderFetchStatusIndicator
                source={source}
                iconUrl={iconUrl}
                status={status}
                progress={progress}
                error={error}
              />
              {wait !== undefined && (
                <div className={clsx(styles.wait, isOwner && styles.isOwner)}>
                  {wait}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.primary} translate='no'>
          <div className={styles.innerPrimary}>
            <div className={styles.title}>{title}</div>
            <div className={styles.artist}>{artist}</div>
          </div>
          <div className={clsx(styles.user, isOwner && styles.isOwner)}>
            {userDisplayName}
          </div>
        </div>

        <Buttons btnWidth={56} isExpanded={expanded} className={styles.btnContainer}>
          {status === 'error' && (
            <Button
              className={styles.danger}
              icon='ALERT_OUTLINE'
              onClick={isAdmin ? handleInfoClick : handleErrorInfoClick}
              aria-label='Error Info'
            />
          )}
          {status !== 'error' && isAdmin && (
            <Button
              className={styles.active}
              data-hide
              icon='INFO_OUTLINE'
              onClick={handleInfoClick}
              aria-label='Info'
            />
          )}
          {isRetryable && (
            <Button
              className={styles.danger}
              data-hide
              icon='REPLAY'
              onClick={handleRetryClick}
              aria-label='Retry'
            />
          )}
          {isCancelable && (
            <Button
              className={styles.danger}
              data-hide
              icon='CLEAR'
              onClick={handleCancelClick}
              aria-label='Cancel'
            />
          )}
        </Buttons>
      </div>
    </div>
  )
}

export default ProviderQueueItem
