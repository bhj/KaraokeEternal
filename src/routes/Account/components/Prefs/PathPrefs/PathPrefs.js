import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import HttpApi from 'lib/HttpApi'
import Icon from 'components/Icon'
import PathChooser from './PathChooser'
import PathItem from './PathItem'
import styles from './PathPrefs.css'
import { receivePrefs, requestScan, setPathPriority } from 'store/modules/prefs'

const api = new HttpApi('prefs/path')

const PathPrefs = props => {
  const paths = useSelector(state => state.prefs.paths)
  const [isExpanded, setExpanded] = useState(false)
  const [isChoosing, setChoosing] = useState(false)
  const [priority, setPriority] = useState(paths.result)

  const toggleExpanded = useCallback(() => setExpanded(prevState => !prevState), [])
  const handleCloseChooser = useCallback(() => setChoosing(false), [])
  const handleOpenChooser = useCallback(() => setChoosing(true), [])

  useEffect(() => {
    // local state for immediate UI updates
    setPriority(paths.result)
  }, [paths])

  const dispatch = useDispatch()
  const handleRefresh = useCallback(() => dispatch(requestScan()), [dispatch])
  const handleDragEnd = useCallback(dnd => {
    // dropped outside the list?
    if (!dnd.destination) return

    const res = priority.slice() // copy
    const [removed] = res.splice(dnd.source.index, 1)
    res.splice(dnd.destination.index, 0, removed)

    setPriority(res)
    dispatch(setPathPriority(res))
  }, [dispatch, priority])

  const handleAddPath = useCallback(dir => {
    api('POST', `/?dir=${encodeURIComponent(dir)}`)
      .then(res => {
        dispatch(receivePrefs(res))
        setChoosing(false)
      }).catch(err => {
        alert(err)
      })
  }, [dispatch])

  const handleRemovePath = useCallback(e => {
    const { path, pathId } = paths.entities[e.currentTarget.dataset.pathId]

    if (!confirm(`Remove folder from library?\n\n${path}`)) {
      return
    }

    // optimistically update local state
    setPriority(priority.filter(id => id !== pathId))

    api('DELETE', `/${pathId}`)
      .then(res => {
        dispatch(receivePrefs(res))
      }).catch(err => {
        alert(err)
      })
  }, [dispatch, paths, priority])

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='FOLDER_MUSIC' size={28} className={styles.icon} />
        <div className={styles.title}>Media Folders</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} className={styles.icon} />
        </div>
      </div>

      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        {paths.result.length === 0 &&
          <p style={{ marginTop: 0 }}>Add a media folder to get started.</p>
        }

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId='droppable'>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {priority.map((pathId, i) =>
                  <PathItem index={i} key={pathId} path={paths.entities[pathId]} onRemove={handleRemovePath}/>
                )}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className={styles.btnContainer}>
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
