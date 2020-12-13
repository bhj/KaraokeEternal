import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PathItem from './PathItem'
import Modal from 'components/Modal'
import HttpApi from 'lib/HttpApi'
import './PathChooser.css'
const api = new HttpApi('prefs/path')

const PathChooser = props => {
  const listRef = useRef()
  const [pathInfo, setPathInfo] = useState({
    current: null,
    parent: null,
    children: [],
  })

  const handleChoose = useCallback(() => props.onChoose(pathInfo.current), [pathInfo.current])
  const ls = useCallback(dir => {
    api('GET', `/ls?dir=${encodeURIComponent(dir)}`)
      .then(res => setPathInfo(res))
      .catch(err => alert(err))
  })

  // get initial list when chooser first becomes visible
  useEffect(() => {
    if (props.isVisible) ls(pathInfo.current || '.')
  }, [props.isVisible])

  // scroll to top when changing dirs
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [pathInfo.current])

  return (
    <Modal
      isVisible={props.isVisible}
      onClose={props.onCancel}
      title='Add Folder'
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div styleName='container'>
        <div styleName='folderCurrent'>
          {pathInfo.current || '\u00a0'}
        </div>

        <div styleName='folderList' ref={listRef}>
          {pathInfo.parent !== false &&
            <strong><PathItem path={'..'} onSelect={() => ls(pathInfo.parent)} /></strong>
          }

          {pathInfo.children.map((item, i) =>
            <PathItem key={i} path={item.label} onSelect={() => ls(item.path)} />
          )}
        </div>

        <div style={{ display: 'flex' }}>
          <button styleName='submit' className='primary' onClick={handleChoose}>
              Add Folder
          </button>
          <button styleName='cancel' onClick={props.onCancel}>
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
