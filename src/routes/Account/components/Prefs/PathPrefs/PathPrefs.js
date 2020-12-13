import React, { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PathChooser from './PathChooser'
import Icon from 'components/Icon'
import './PathPrefs.css'
import HttpApi from 'lib/HttpApi'
import { receivePrefs, requestScan } from 'store/modules/prefs'
const api = new HttpApi('prefs/path')

const PathPrefs = props => {
  const [isExpanded, setExpanded] = useState(false)
  const [isChoosing, setChoosing] = useState(false)
  const paths = useSelector(state => state.prefs.paths)

  const handleOpenChooser = useCallback(() => setChoosing(true))
  const handleCloseChooser = useCallback(() => setChoosing(false))
  const toggleExpanded = useCallback(() => setExpanded(!isExpanded))

  const dispatch = useDispatch()
  const handleRefresh = useCallback(() => dispatch(requestScan()), [dispatch])

  const handleAddPath = useCallback(dir => {
    api('POST', `/?dir=${encodeURIComponent(dir)}`)
      .then(res => {
        dispatch(receivePrefs(res))
        setChoosing(false)
      }).catch(err => {
        alert(err)
      })
  }, [dispatch])

  const handleRemovePath = useCallback(pathId => {
    const { path } = paths.entities[pathId]

    if (!confirm(`Remove folder from library?\n\n${path}`)) {
      return
    }

    api('DELETE', `/${pathId}`)
      .then(res => {
        dispatch(receivePrefs(res))
      }).catch(err => {
        alert(err)
      })
  }, [dispatch, paths])

  return (
    <div styleName='container'>
      <div styleName='heading' onClick={toggleExpanded}>
        <Icon icon='FOLDER_MUSIC' size={28} styleName='icon' />
        <div styleName='title'>Media Folders</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} styleName='icon' />
        </div>
      </div>

      <div styleName='content' style={{ display: isExpanded ? 'block' : 'none' }}>
        {paths.result.length === 0 &&
          <p style={{ marginTop: 0 }}>Add a media folder to get started.</p>
        }

        {paths.result.map(id =>
          <div key={id} styleName='pathItem'>
            <div styleName='pathName'>
              {paths.entities[id].path}
            </div>
            <div onClick={() => handleRemovePath(id)} styleName='btnClear'>
              <Icon icon='CLEAR' size={32} />
            </div>
          </div>
        )}
        <br />
        <div style={{ display: 'flex' }}>
          <button className='primary' style={{ flex: 1, width: 'auto' }} onClick={handleOpenChooser}>
            Add Folder
          </button>
          {paths.result.length > 0 &&
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={handleRefresh}>
              Refresh
            </button>
          }
        </div>

        <PathChooser
          isVisible={isChoosing}
          onCancel={handleCloseChooser}
          onChoose={handleAddPath}
        />
      </div>
    </div>
  )
}

export default PathPrefs
