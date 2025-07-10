import React, { useEffect, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'store/hooks'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import HttpApi from 'lib/HttpApi'
import Accordion from 'components/Accordion/Accordion'
import Icon from 'components/Icon/Icon'
import PathChooser from './PathChooser/PathChooser'
import PathInfo from './PathInfo/PathInfo'
import PathItem from './PathItem/PathItem'
import Button from 'components/Button/Button'
import styles from './PathPrefs.css'
import { receivePrefs, requestScan, requestScanAll, setPathPriority, setPathPrefs } from 'store/modules/prefs'
import type { Path } from 'shared/types'

const api = new HttpApi('prefs/path')

const PathPrefs = () => {
  const paths = useAppSelector(state => state.prefs.paths)
  const [isChoosing, setChoosing] = useState(false)
  const [editingPath, setEditingPath] = useState<Path | null>(null)
  const [priority, setPriority] = useState(paths.result)

  const handleCloseChooser = useCallback(() => setChoosing(false), [])
  const handleOpenChooser = useCallback(() => setChoosing(true), [])
  const handleCloseInfo = useCallback(() => setEditingPath(null), [])

  const dispatch = useAppDispatch()

  useEffect(() => {
    // local state for immediate UI updates
    setPriority(paths.result)
  }, [paths])

  const handleDragEnd = useCallback((dnd: DropResult) => {
    // dropped outside the list?
    if (!dnd.destination) return

    const res = priority.slice() // copy
    const [removed] = res.splice(dnd.source.index, 1)
    res.splice(dnd.destination.index, 0, removed)

    setPriority(res)
    dispatch(setPathPriority(res as number[]))
  }, [dispatch, priority])

  const handleAdd = useCallback((dir: string, prefs: object) => {
    api.post(`/?dir=${encodeURIComponent(dir)}`, { body: prefs })
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

    api.delete(`/${pathId}`)
      .then((res) => {
        dispatch(receivePrefs(res))
        return
      }).catch((err) => {
        alert(err)
      })
  }, [dispatch, paths, priority])

  const handleUpdate = useCallback((pathId: number, data: FormData) => {
    dispatch(setPathPrefs({ pathId, data }))
  }, [dispatch])

  const handleInfo = useCallback((pathId: number) => setEditingPath(paths.entities[pathId]), [paths])
  const handleRefresh = useCallback((pathId: number) => dispatch(requestScan(pathId)), [dispatch])
  const handleRefreshAll = useCallback(() => dispatch(requestScanAll()), [dispatch])

  return (
    <Accordion headingComponent={(
      <div className={styles.heading}>
        <Icon icon='FOLDER_MUSIC' />
        <div className={styles.title}>Media Folders</div>
      </div>
    )}
    >
      <div className={styles.content}>
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
          {paths.result.length > 0 && (
            <Button onClick={handleRefreshAll} variant='default'>
              Scan Folders
            </Button>
          )}
          <Button onClick={handleOpenChooser} variant='primary'>
            Add Folder
          </Button>
        </div>

        {isChoosing && (
          <PathChooser
            onCancel={handleCloseChooser}
            onChoose={handleAdd}
          />
        )}

        {!!editingPath && (
          <PathInfo
            onClose={handleCloseInfo}
            onRemove={handleRemove}
            onUpdate={handleUpdate}
            path={editingPath}
          />
        )}
      </div>
    </Accordion>
  )
}

export default PathPrefs
