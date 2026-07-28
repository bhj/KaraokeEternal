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
          <div>
            <InputCheckbox
              label='Watch folder'
              defaultChecked={path?.prefs?.isWatchingEnabled}
              onChange={event => handleChange({ isWatchingEnabled: event.currentTarget.checked })}
              aria-describedby='isWatchingEnabled-desc'
            />
            <p id='isWatchingEnabled-desc' className={styles.description}>
              Automatically scan this folder when a change is detected.
            </p>
          </div>
          <div>
            <InputCheckbox
              label='Always scan all files'
              defaultChecked={path?.prefs?.scanFull}
              onChange={event => handleChange({ scanFull: event.currentTarget.checked })}
              aria-describedby='scanFull-desc'
            />
            <p id='scanFull-desc' className={styles.description}>
              When scanning this folder (automatically or manually), always scan every file instead of only those that have changed since the last scan.
            </p>
          </div>
          <div>
            <InputCheckbox
              label='Allow video background keying'
              defaultChecked={path?.prefs?.isVideoKeyingEnabled}
              onChange={event => handleChange({ isVideoKeyingEnabled: event.currentTarget.checked })}
              aria-describedby='isVideoKeyingEnabled-desc'
            />
            <p id='isVideoKeyingEnabled-desc' className={styles.description}>
              Enable videos in this folder to have their backgrounds removed, letting the visualizer appear behind the lyrics. Works best with videos that have a solid background color. WARNING: May cause flickering in some cases.
            </p>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default PathInfo
