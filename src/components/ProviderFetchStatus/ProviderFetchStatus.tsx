import React, { useState } from 'react'
import clsx from 'clsx'
import Icon from 'components/Icon/Icon'
import type { ProviderFetchStatus } from '../../routes/Library/modules/library'
import styles from './ProviderFetchStatus.css'

interface Props {
  status?: ProviderFetchStatus
  progress?: number
  error?: string
  /** Provider source name; when set, its icon is rendered at the center of the ring */
  source?: string
  iconUrl?: string
}

const RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ProviderFetchStatusIndicator = ({ status, progress = 0, error, source, iconUrl }: Props) => {
  const [iconFailed, setIconFailed] = useState(false)
  const [iconLoaded, setIconLoaded] = useState(false)

  const hasIcon = source !== undefined
  const isPending = status === 'pending'
  const isDownloading = status === 'downloading'
  const showRing = isPending || isDownloading
  const pct = Math.round(progress * 100)

  const label = isPending
    ? 'Queued'
    : isDownloading
      ? `Downloading ${pct}%`
      : status === 'complete'
        ? 'Downloaded'
        : status === 'error'
          ? error ?? 'Error'
          : status === 'canceled'
            ? 'Canceled'
            : source ?? ''

  return (
    <div className={styles.wrap} aria-label={label}>
      {showRing && (
        <svg className={styles.ring} viewBox='0 0 40 40'>
          <circle className={styles.ringTrack} cx='20' cy='20' r={RADIUS} />
          {/* distinct keys so pending -> downloading swaps elements rather than
              transitioning the spinner's arc/rotation into the progress arc */}
          {isPending
            ? (
                <circle
                  key='spinner'
                  className={styles.ringSpinner}
                  cx='20'
                  cy='20'
                  r={RADIUS}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * 0.7}
                />
              )
            : (
                <circle
                  key='progress'
                  className={styles.ringProgress}
                  cx='20'
                  cy='20'
                  r={RADIUS}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                />
              )}
        </svg>
      )}

      {hasIcon && (
        <div className={styles.icon}>
          {iconUrl && !iconFailed
            ? (
                <img
                  src={iconUrl}
                  alt={source}
                  className={clsx(!iconLoaded && styles.iconLoading)}
                  onLoad={() => setIconLoaded(true)}
                  onError={() => setIconFailed(true)}
                />
              )
            : <Icon icon='CLOUD' />}
        </div>
      )}
    </div>
  )
}

export default ProviderFetchStatusIndicator
