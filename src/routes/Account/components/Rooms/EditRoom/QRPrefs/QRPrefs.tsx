import React, { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import Accordion from 'components/Accordion/Accordion'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Icon from 'components/Icon/Icon'
import Slider from 'components/Slider/Slider'
import type { IRoomPrefs } from 'shared/types'
import styles from './QRPrefs.css'

interface QRPrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
  roomPassword: string
  roomPasswordDirty: boolean
}

const QRPrefs = ({ onChange, prefs = {}, roomPassword, roomPasswordDirty }: QRPrefsProps) => {
  const [isQRPasswordEnabled, setIsQRPasswordEnabled] = useState(!!prefs?.qr?.password)

  const handleSetPref = useCallback((update: Partial<IRoomPrefs>) => {
    onChange({ ...prefs, ...update })
  }, [onChange, prefs])

  useEffect(() => {
    if (isQRPasswordEnabled && roomPasswordDirty && prefs?.qr?.password !== roomPassword) {
      handleSetPref({ qr: { ...prefs.qr, password: roomPassword } })
    }
  }, [handleSetPref, isQRPasswordEnabled, prefs, roomPassword, roomPasswordDirty])

  return (
    <Accordion
      headingComponent={(
        <div className={styles.heading}>
          <Icon icon='QR_CODE' />
          <div className={styles.title}>QR Code</div>
        </div>
      )}
    >
      <div className={styles.content}>
        <div className={styles.field}>
          <InputCheckbox
            label='Show QR code'
            checked={prefs?.qr?.isEnabled ?? false}
            onChange={event => handleSetPref({ qr: { ...prefs.qr, isEnabled: event.currentTarget.checked } })}
          />
        </div>
        {prefs?.qr?.isEnabled && roomPassword && (
          <div className={styles.field}>
            <InputCheckbox
              label='Include room password'
              checked={isQRPasswordEnabled}
              onChange={(event) => {
                const checked = event.currentTarget.checked
                setIsQRPasswordEnabled(checked)
                if (!checked) handleSetPref({ qr: { ...prefs.qr, password: '' } })
              }}
            />
          </div>
        )}
        {(isQRPasswordEnabled && !roomPasswordDirty) && (
          <div className={styles.field}>
            <input
              type='password'
              autoComplete='new-password'
              value={prefs?.qr?.password ?? ''}
              onChange={e => handleSetPref({ qr: { ...prefs.qr, password: e.target.value } })}
              onFocus={e => e.target.select()}
              placeholder='re-enter room password'
            />
          </div>
        )}
        <div className={clsx(styles.field)}>
          <label id='label-qr-size'>Size</label>
          <Slider
            className={styles.slider}
            min={0}
            max={1}
            step={0.05}
            value={prefs?.qr?.size ?? 0.5}
            onChange={(val: number) => handleSetPref({ qr: { ...prefs.qr, size: val } })}
            aria-labelledby='label-qr-size'
          />
        </div>
        <div className={clsx(styles.field)}>
          <label id='label-qr-opacity'>Opacity</label>
          <Slider
            className={styles.slider}
            min={0.25}
            max={1}
            step={0.075}
            value={prefs?.qr?.opacity ?? 0.625}
            onChange={(val: number) => handleSetPref({ qr: { ...prefs.qr, opacity: val } })}
            aria-labelledby='label-qr-opacity'
          />
        </div>
      </div>
    </Accordion>
  )
}

export default QRPrefs
