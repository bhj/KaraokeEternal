import React, { useEffect, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import HttpApi from 'lib/HttpApi'
import Icon from 'components/Icon/Icon'
import PathChooser from './PathChooser/PathChooser'
import PathInfo from './PathInfo/PathInfo'
import PathItem from './PathItem/PathItem'
import styles from './PathPrefs.css'
import { receivePrefs, requestScan, requestScanAll, setPathPriority, setPathPrefs } from 'store/modules/prefs'
import type { Path } from 'shared/types'

const api = new HttpApi('prefs/path')

const PathPrefs = () => {
  const paths = useAppSelector(state => state.prefs.paths)
  const [isExpanded, setExpanded] = useState(false)
  const [isChoosing, setChoosing] = useState(false)
  const [editingPath, setEditingPath] = useState<Path | null>(null)
  const [priority, setPriority] = useState(paths.result)

  const toggleExpanded = useCallback(() => setExpanded(prevState => !prevState), [])
  const handleCloseChooser = useCallback(() => setChoosing(false), [])
  const handleOpenChooser = useCallback(() => setChoosing(true), [])
  const handleCloseInfo = useCallback(() => setEditingPath(null), [])

  const dispatch = useAppDispatch()

  useEffect(() => {
    // local state for immediate UI updates
    setPriority(paths.result)
  }, [paths])

  const handleDragEnd = useCallback((dnd) => {
    // dropped outside the list?
    if (!dnd.destination) return

    const res = priority.slice() // copy
    const [removed] = res.splice(dnd.source.index, 1)
    res.splice(dnd.destination.index, 0, removed)

    setPriority(res)
    dispatch(setPathPriority(res as number[]))
  }, [dispatch, priority])

  const handleAdd = useCallback((dir: string, prefs: object) => {
    api('POST', `/?dir=${encodeURIComponent(dir)}`, { body: prefs })
      .then((res) => {
        dispatch(receivePrefs(res))
        setChoosing(false)
        return
      }).catch((err) => {
        alert(err)
      })
  }, [dispatch])

  const handleRemove = useCallback((pathId: number) => {
    if (!confirm(`Remove folder from library?\n\n${paths.entities[pathId].path}`)) {
      return
    }

    // optimistically update local state
    setPriority(priority.filter(id => id !== pathId))
    setEditingPath(null)

    api('DELETE', `/${pathId}`)
      .then((res) => {
        dispatch(receivePrefs(res))
        return
      }).catch((err) => {
        alert(err)
      })
  }, [dispatch, paths, priority])

  const handleUpdate = useCallback((pathId, data) => {
    dispatch(setPathPrefs({ pathId, data }))
  }, [dispatch])

  const handleInfo = useCallback((pathId: number) => setEditingPath(paths.entities[pathId]), [paths])
  const handleRefresh = useCallback((pathId: number) => dispatch(requestScan(pathId)), [dispatch])
  const handleRefreshAll = useCallback(() => dispatch(requestScanAll()), [dispatch])

  return (
    <div className={styles.container}>
      <div className={styles.heading} onClick={toggleExpanded}>
        <Icon icon='FOLDER_MUSIC' size={28} />
        <div className={styles.title}>Media Folders</div>
        <div>
          <Icon icon={isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} />
        </div>
      </div>

      <div className={styles.content} style={{ display: isExpanded ? 'block' : 'none' }}>
        {paths.result.length === 0
        && <p style={{ marginTop: 0 }}>Add a media folder to get started.</p>}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId='droppable'>
            {provided => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {priority.map((pathId, i) => (
                  <PathItem
                    index={i}
                    key={pathId}
                    path={paths.entities[pathId]}
                    onInfo={handleInfo}
                    onRefresh={handleRefresh}
                  />
                ),
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className={styles.btnContainer}>
          {paths.result.length > 0
          && (
            <button onClick={handleRefreshAll}>
              Scan Folders
            </button>
          )}
          <button className='primary' onClick={handleOpenChooser}>
            Add Folder
          </button>
        </div>

        <PathChooser
          isVisible={isChoosing}
          onCancel={handleCloseChooser}
          onChoose={handleAdd}
        />

        <PathInfo
          isVisible={!!editingPath}
          onClose={handleCloseInfo}
          onRemove={handleRemove}
          onUpdate={handleUpdate}
          path={editingPath}
        />
      </div>
    </div>
  )
}

export default PathPrefs
