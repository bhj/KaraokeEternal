import React, { useCallback } from 'react'
import Modal from 'components/Modal/Modal'
import styles from './PathInfo.css'
import type { Path } from 'shared/types'

interface PathInfoProps {
  isVisible: boolean
  onClose: () => void
  onRemove: (pathId: number) => void
  onUpdate: (pathId: number, data: object) => void
  path: Path
}

const PathInfo = (props: PathInfoProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    props.onUpdate(props.path.pathId, {
      [e.target.name]: e.target.checked,
    })
  }, [props])

  const handleRemove = useCallback(() => props.onRemove(props.path.pathId), [props])

  return (
    <Modal
      visible={props.isVisible}
      onClose={props.onClose}
      title='Media Folder'
      // style={{ minWidth: '300px' }}
    >
      <div>
        <p className={styles.path}>{props.path?.path}</p>
        <p>
          <span className={styles.label}>pathId: </span>
          {props.path?.pathId}
        </p>

        <form className={styles.form}>
          <label>
            <input
              type='checkbox'
              defaultChecked={props.path?.prefs?.isWatchingEnabled}
              name='isWatchingEnabled'
              onChange={handleChange}
            />
             &nbsp;Watch folder
          </label>
          <br />
          <br />
          <br />
        </form>

        <div className={styles.footer}>
          <button type='button' onClick={handleRemove}>Remove Folder</button>
          <button type='button' onClick={props.onClose}>Done</button>
        </div>
      </div>
    </Modal>
  )
}

export default PathInfo
