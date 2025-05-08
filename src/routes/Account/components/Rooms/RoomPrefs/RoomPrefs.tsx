import React, { useCallback, useState } from 'react'
import Icon from 'components/Icon/Icon'
import OptimisticSlider from 'components/OptimisticSlider/OptimisticSlider'
import type { IRoomPrefs } from 'shared/types'
import styles from './RoomPrefs.css'

interface RoomPrefsProps {
  prefs: Partial<IRoomPrefs>
  onChange: (prefs: Partial<IRoomPrefs>) => void
}

const RoomPrefs = ({ onChange, prefs = {} }: RoomPrefsProps) => {
  const [isExpanded, setExpanded] = useState(true)
  const toggleExpanded = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded])

  const handleSetPref = useCallback((update: Partial<IRoomPrefs>) => {
    onChange({ ...prefs, ...update })
  }, [onChange, prefs])

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='QR_CODE' size={28} className={styles.icon} />
        <div className={styles.title}>QR Code</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} className={styles.icon} />
        </div>
      </div>

      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        <div className={styles.field}>
          <label>
            <input
              type='checkbox'
              checked={prefs?.qr?.isEnabled ?? false}
              onChange={e => handleSetPref({ qr: { ...prefs.qr, isEnabled: e.target.checked } })}
            />
            {' '}
            Show QR code
          </label>
        </div>
        <div className={styles.field}>
          <label className={styles.field}>Size</label>
          <OptimisticSlider
            min={0}
            max={1}
            step={0.05}
            value={prefs?.qr?.size ?? 0.5}
            onChange={(val: number) => handleSetPref({ qr: { ...prefs.qr, size: val } })}
            handle={handle}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.field}>Opacity</label>
          <OptimisticSlider
            min={0.25}
            max={1}
            step={0.075}
            value={prefs?.qr?.opacity ?? 0.625}
            onChange={(val: number) => handleSetPref({ qr: { ...prefs.qr, opacity: val } })}
            handle={handle}
          />
        </div>
        <div className={styles.field}>
          <input
            type='password'
            autoComplete='new-password'
            defaultValue={prefs?.qr?.password ? '*'.repeat(32) : ''}
            onChange={e => handleSetPref({ qr: { ...prefs.qr, password: e.target.value } })}
            onFocus={e => e.target.select()}
            placeholder='room password (optional)'
          />
        </div>
      </div>
    </div>
  )
}

export default RoomPrefs

// slider handle/grabber
const handle = (node: React.ReactElement): React.ReactElement => {
  // rc-slider passes a node (div) to which we add style and children
  return React.cloneElement(node as React.ReactElement<{ className?: string }>, { className: styles.handle }, (
    <Icon icon='CIRCLE' size={36} />
  ))
}
