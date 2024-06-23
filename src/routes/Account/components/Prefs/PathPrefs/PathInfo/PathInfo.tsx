import React, { useCallback, useRef } from 'react'
import Modal from 'components/Modal'
import styles from './PathInfo.css'
import type { Path } from 'shared/types'

interface PathInfoProps {
  isVisible: boolean
  onClose(...args: unknown[]): unknown
  onRemove: (pathId: number) => void
  onUpdate: (pathId: number, data: object) => void
  path: Path
}

const PathInfo = (props: PathInfoProps) => {
  const formRef = useRef(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    props.onUpdate(props.path.pathId, {
      [e.target.name]: e.target.checked
    })
  }, [props])

  const handleRemove = useCallback(() => props.onRemove(props.path.pathId), [props])

  return (
    <Modal
      isVisible={props.isVisible}
      onClose={props.onClose}
      title={'Media Folder'}
      style={{ minWidth: '300px' }}
    >
      <form ref={formRef} className={styles.form}>
        <label>
          <input type='checkbox'
            defaultChecked={props.path?.prefs?.isWatchingEnabled}
            name='isWatchingEnabled'
            onChange={handleChange}
          />
           &nbsp;Watch folder for changes
        </label>
        <br/>
        <br/>
      </form>

      <button type='button' onClick={handleRemove} className={styles.btn}>
        Remove Path
      </button>

      <button type='button' onClick={props.onClose}>Done</button>
    </Modal>
  )
}

export default PathInfo
