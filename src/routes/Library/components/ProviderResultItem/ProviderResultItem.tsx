import React, { useState } from 'react'
import clsx from 'clsx'
import { useSwipeable } from 'react-swipeable'
import { useAppDispatch } from 'store/hooks'
import Button from 'components/Button/Button'
import Buttons from 'components/Buttons/Buttons'
import ProviderFetchStatusIndicator from 'components/ProviderFetchStatus/ProviderFetchStatus'
import { isInFlight } from 'components/ProviderFetchStatus/isInFlight'
import { useProviderInfo } from 'components/ProviderInfo/ProviderInfoContext'
import useToggleAnimation from 'lib/useToggleAnimation'
import { showErrorMessage } from 'store/modules/ui'
import { formatDuration } from 'lib/dateTime'
import Highlight from '../Highlight/Highlight'
import { providerFetchCancel, type ProviderFetchView } from '../../modules/library'
import styles from './ProviderResultItem.css'

let ignoreMouseup = false

export interface ProviderFetchItem {
  providerId: number
  itemId: string
  title: string
  artist: string
  source: string
  iconUrl: string
  duration?: number
}

interface ProviderResultItemProps {
  providerId: number
  itemId: string
  title: string
  artist: string
  source: string
  iconUrl: string
  duration?: number
  highlight: RegExp | null
  isAdmin: boolean
  userId: number | null
  fetchView?: ProviderFetchView
  onFetch: (item: ProviderFetchItem) => void
}

const ProviderResultItem = ({
  providerId,
  itemId,
  title,
  artist,
  source,
  iconUrl,
  duration,
  highlight,
  isAdmin,
  userId,
  fetchView,
  onFetch,
}: ProviderResultItemProps) => {
  const [expanded, setExpanded] = useState(false)
  const dispatch = useAppDispatch()
  const showProviderInfo = useProviderInfo()

  const disabled = isInFlight(fetchView?.status)
  const glow = useToggleAnimation(disabled, styles.animateGlow)
  const isRequester = fetchView?.requests.some(r => r.userId === userId) ?? false
  const isCancelable = disabled && (isAdmin || isRequester)
  const isErrored = fetchView?.status === 'error'

  const handleClick = () => {
    if (ignoreMouseup) {
      ignoreMouseup = false
      return
    }
    if (disabled) return
    onFetch({ providerId, itemId, title, artist, source, iconUrl, duration })
  }

  // arrow keys are the keyboard equivalent of swiping, and stay live while
  // disabled so an in-flight fetch can still be canceled
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setExpanded(isAdmin || isCancelable)
    else if (e.key === 'ArrowRight') setExpanded(false)
    else if ((e.key === 'Enter' || e.key === ' ') && !disabled) onFetch({ providerId, itemId, title, artist, source, iconUrl, duration })
    else return
    e.preventDefault()
  }

  const handleInfoClick = () => {
    showProviderInfo({
      providerId,
      itemId,
      title,
      artist,
      source,
      status: fetchView?.status,
      error: fetchView?.error,
    })
  }

  const handleErrorInfoClick = () => dispatch(showErrorMessage(fetchView?.error ?? 'Error'))

  const handleRemoveClick = () => {
    dispatch(providerFetchCancel({ providerId, itemId }))
    setExpanded(false)
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: ({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(isAdmin || isCancelable)
    },
    onSwipedRight: ({ event }) => {
      ignoreMouseup = event.type === 'mouseup'
      setExpanded(false)
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  return (
    <div
      {...swipeHandlers}
      className={clsx(styles.container, styles.withArtist, disabled && styles.containerDisabled, disabled && styles.queued)}
    >
      <div
        className={styles.primary}
        role='button'
        tabIndex={0}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.status}>
          <ProviderFetchStatusIndicator
            source={source}
            iconUrl={iconUrl}
            status={fetchView?.status}
            progress={fetchView?.progress}
            error={fetchView?.error}
          />
          {duration !== undefined && (
            <div className={styles.duration}>
              {formatDuration(duration)}
            </div>
          )}
        </div>
        <div className={clsx(styles.title, glow.className)} onAnimationEnd={glow.onAnimationEnd}>
          <Highlight text={title} pattern={highlight} />
          <div className={styles.artist}>
            <Highlight text={artist} pattern={highlight} />
          </div>
        </div>
      </div>

      <Buttons btnWidth={56} isExpanded={expanded}>
        {isErrored && (
          <Button
            className={styles.danger}
            icon='ALERT_OUTLINE'
            onClick={isAdmin ? handleInfoClick : handleErrorInfoClick}
            aria-label='Error Info'
          />
        )}
        {!isErrored && isAdmin && (
          <Button
            className={clsx(styles.btn, styles.info)}
            data-hide
            icon='INFO_OUTLINE'
            onClick={handleInfoClick}
            aria-label='Info'
          />
        )}
        {isCancelable && (
          <Button
            className={styles.danger}
            data-hide
            icon='CLEAR'
            onClick={handleRemoveClick}
            aria-label='Cancel'
          />
        )}
      </Buttons>
    </div>
  )
}

export default ProviderResultItem
