import React, { useCallback, useEffect, useState } from 'react'
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
  const [qrPasswordEnabled, setQrPasswordEnabled] = useState(!!prefs?.qr?.password)

  const handleSetPref = useCallback((update: Partial<IRoomPrefs>) => {
    onChange({ ...prefs, ...update })
  }, [onChange, prefs])

  useEffect(() => {
    if (qrPasswordEnabled && roomPasswordDirty && prefs?.qr?.password !== roomPassword) {
      handleSetPref({ qr: { ...prefs.qr, password: roomPassword } })
    }
  }, [handleSetPref, qrPasswordEnabled, prefs, roomPassword, roomPasswordDirty])

  return (
    <Accordion
      renderHeading={button => <div className={styles.heading}>{button}</div>}
      heading={(
        <>
          <Icon icon='QR_CODE' />
          <div>QR Code</div>
        </>
      )}
    >
      <div className={styles.content}>
        <div>
          <InputCheckbox
            label='Show QR code'
            checked={prefs?.qr?.isEnabled ?? false}
            onChange={event => handleSetPref({ qr: { ...prefs.qr, isEnabled: event.currentTarget.checked } })}
          />
        </div>
        {prefs?.qr?.isEnabled && (
          <>
            <div>
              <input
                type='text'
                autoComplete='off'
                inputMode='url'
                value={prefs?.qr?.url ?? ''}
                onChange={e => handleSetPref({ qr: { ...prefs.qr, url: e.target.value || undefined } })}
                onFocus={e => e.target.select()}
                placeholder='QR code URL (optional)'
              />
            </div>
            {roomPassword && (
              <div>
                <InputCheckbox
                  label='Include room password'
                  checked={qrPasswordEnabled}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked
                    setQrPasswordEnabled(checked)
                    if (!checked) handleSetPref({ qr: { ...prefs.qr, password: '' } })
                  }}
                />
              </div>
            )}
            {(qrPasswordEnabled && !roomPasswordDirty) && (
              <div>
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
            <div>
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
            <div>
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
          </>
        )}
      </div>
    </Accordion>
  )
}

export default QRPrefs
