import React from 'react'
import Button from 'components/Button/Button'
import Modal from 'components/Modal/Modal'
import { useAppSelector } from 'store/hooks'
import type { ProviderInfoData } from './ProviderInfoContext'
import styles from './ProviderInfo.css'

interface ProviderInfoProps {
  info: ProviderInfoData | null
  isVisible: boolean
  onClose: () => void
}

const ProviderInfo = ({ info, isVisible, onClose }: ProviderInfoProps) => {
  const providerName = useAppSelector(state => info ? state.prefs.providers.entities[info.providerId]?.name : undefined)
  if (!info) return null

  return (
    <Modal
      visible={isVisible}
      onClose={onClose}
      title='Provider Result'
      buttons={<Button variant='primary' onClick={onClose}>Done</Button>}
    >
      <div className={styles.container}>
        <p>
          {providerName && (
            <>
              <span className={styles.label}>Provider: </span>
              {providerName}
              <br />
            </>
          )}
          <span className={styles.label}>Provider ID: </span>
          {info.providerId}
          {info.status && (
            <>
              <br />
              <span className={styles.label}>Status: </span>
              {info.status}
            </>
          )}
        </p>

        {info.error && (
          <p>
            <span className={styles.label}>Error: </span>
            {info.error}
          </p>
        )}

        <span className={styles.label}>Title: </span>
        {info.title}
        <br />
        <span className={styles.label}>Artist: </span>
        {info.artist}
        <br />
        <span className={styles.label}>Item ID: </span>
        {info.itemId}
        <br />
        {info.source && (
          <>
            <span className={styles.label}>Source: </span>
            {info.source}
            <br />
          </>
        )}
      </div>
    </Modal>
  )
}

export default ProviderInfo
