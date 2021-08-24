import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PathItem from './PathItem'
import Modal from 'components/Modal'
import HttpApi from 'lib/HttpApi'
import styles from './PathChooser.css'
const api = new HttpApi('prefs/path')

const PathChooser = props => {
  const { onCancel, onChoose, isVisible } = props
  const listRef = useRef()
  const [pathInfo, setPathInfo] = useState({
    current: null,
    parent: null,
    children: [],
  })

  const handleChoose = useCallback(() => { onChoose(pathInfo.current) }, [onChoose, pathInfo])
  const ls = useCallback(dir => {
    api('GET', `/ls?dir=${encodeURIComponent(dir)}`)
      .then(res => setPathInfo(res))
      .catch(err => alert(err))
  }, [])

  // get initial list when chooser first becomes visible
  useEffect(() => {
    if (isVisible) ls(pathInfo.current || '.')
  }, [isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  // scroll to top when changing dirs
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [])

  return (
    <Modal
      isVisible={isVisible}
      onClose={onCancel}
      title='Add Folder'
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div className={styles.container}>
        <div className={styles.folderCurrent}>
          {pathInfo.current || '\u00a0'}
        </div>

        <div className={styles.folderList} ref={listRef}>
          {pathInfo.parent !== false &&
            <strong><PathItem path={'..'} onSelect={() => ls(pathInfo.parent)} /></strong>
          }

          {pathInfo.children.map((item, i) =>
            <PathItem key={i} path={item.label} onSelect={() => ls(item.path)} />
          )}
        </div>

        <div style={{ display: 'flex' }}>
          <button className={`${styles.submit} primary`} onClick={handleChoose}>
              Add Folder
          </button>
          <button className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

PathChooser.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onChoose: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default PathChooser
