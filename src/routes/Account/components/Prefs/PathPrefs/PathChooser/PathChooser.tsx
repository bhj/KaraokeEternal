import React, { useCallback, useEffect, useRef, useState } from 'react'
import Button from 'components/Button/Button'
import PathItem from './PathItem/PathItem'
import Modal from 'components/Modal/Modal'
import HttpApi from 'lib/HttpApi'
import styles from './PathChooser.css'

const api = new HttpApi('prefs/path')

interface PathItemType {
  label: string
  path: string
}

interface PathInfoType {
  current: string | null
  parent: string | null | false
  children: PathItemType[]
}

interface PathChooserProps {
  onChoose(path: string | null, options: Record<string, unknown>): void
  onCancel(): void
}

const PathChooser = ({ onCancel, onChoose }: PathChooserProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const [pathInfo, setPathInfo] = useState<PathInfoType>({
    current: null,
    parent: null,
    children: [],
  })

  const handleChoose = useCallback(() => {
    onChoose(pathInfo.current, {})
  }, [onChoose, pathInfo])

  const ls = useCallback(async (dir: string) => {
    try {
      const result = await api.get<PathInfoType>(`/ls?dir=${encodeURIComponent(dir)}`)
      setPathInfo(result)
    } catch (err) {
      alert(err)
    }
  }, [])

  // get initial list on first mount
  useEffect(() => {
    ls(pathInfo.current ?? '.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // scroll to top when changing dirs
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [])

  return (
    <Modal
      title='Add Folder'
      className={styles.modal}
      onClose={onCancel}
      scrollable
      buttons={(
        <div className={styles.btnContainer}>
          <Button onClick={onCancel} variant='default'>
            Cancel
          </Button>
          <Button onClick={handleChoose} variant='primary'>
            Add Folder
          </Button>
        </div>
      )}
    >
      <div className={styles.container}>
        <div className={styles.folderCurrent}>
          {pathInfo.current || '\u00a0'}
        </div>

        <div className={styles.folderList} ref={listRef}>
          {pathInfo.parent !== false
            && <strong><PathItem path='..' onSelect={() => ls(pathInfo.parent as string)} /></strong>}

          {pathInfo.children.map((item, i) =>
            <PathItem key={i} path={item.label} onSelect={() => ls(item.path)} />,
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PathChooser
