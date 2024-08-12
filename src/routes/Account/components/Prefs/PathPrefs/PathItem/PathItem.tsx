import React, { useCallback } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import { Path } from 'shared/types'
import styles from './PathItem.css'

interface PathItemProps {
  index: number
  onInfo: (pathId: number) => void
  onRefresh: (pathId: number) => void
  path: Path
}

const PathItem = ({ index, onInfo, onRefresh, path }: PathItemProps) => {
  const handleInfo = useCallback(e => onInfo(e.currentTarget.dataset.pathId), [onInfo])
  const handleRefresh = useCallback(e => onRefresh(e.currentTarget.dataset.pathId), [onRefresh])

  return (
    <Draggable draggableId={`path-${path.pathId}`} index={index}>
      {(provided) => (
        <div className={styles.pathItem}
          key={path.pathId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps}>
            <Icon icon='DRAG_INDICATOR' size={24} className={styles.btnDrag} />
          </div>
          <div className={styles.pathName}>
            {path.path}
          </div>
          <Button
            className={styles.btnRefresh}
            data-path-id={path.pathId}
            icon='REFRESH'
            onClick={handleRefresh}
            size={32}
          />
          <Button
            className={styles.btnInfo}
            data-path-id={path.pathId}
            icon='INFO_OUTLINE'
            onClick={handleInfo}
            size={32}
          />
        </div>
      )}
    </Draggable>
  )
}

export default PathItem
