import React from 'react'
import Modal from 'components/Modal/Modal'
import InputCheckbox from 'components/InputCheckbox/InputCheckbox'
import Button from 'components/Button/Button'
import styles from './PathInfo.css'
import type { Path } from 'shared/types'

interface PathInfoProps {
  onClose: () => void
  onRemove: (pathId: number) => void
  onUpdate: (pathId: number, data: object) => void
  path: Path
}

const PathInfo = ({ onClose, onRemove, onUpdate, path }: PathInfoProps) => {
  const handleChange = (data: Record<string, boolean>) => {
    onUpdate(path.pathId, data)
  }

  const handleRemove = () => onRemove(path.pathId)

  return (
    <Modal
      onClose={onClose}
      title='Media Folder'
      buttons={(
        <>
          <Button onClick={handleRemove} variant='danger'>Remove Folder</Button>
          <Button onClick={onClose} variant='primary'>Done</Button>
        </>
      )}
    >
      <div>
        <p className={styles.path}>
          {path?.path}
          <br />
          <span className={styles.label}>pathId: </span>
          {path?.pathId}
        </p>

        <form className={styles.form}>
          <InputCheckbox
            label='Watch folder'
            defaultChecked={path?.prefs?.isWatchingEnabled}
            onChange={event => handleChange({ isWatchingEnabled: event.currentTarget.checked })}
          />
          <InputCheckbox
            label='Allow video background keying'
            defaultChecked={path?.prefs?.isVideoKeyingEnabled}
            onChange={event => handleChange({ isVideoKeyingEnabled: event.currentTarget.checked })}
          />
        </form>
      </div>
    </Modal>
  )
}

export default PathInfo
