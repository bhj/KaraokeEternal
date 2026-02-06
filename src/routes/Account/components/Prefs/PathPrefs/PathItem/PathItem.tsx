import React from 'react'
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
  const handleInfo = (e: React.SyntheticEvent<HTMLElement>) => onInfo(parseInt(e.currentTarget.dataset.pathId))
  const handleRefresh = (e: React.SyntheticEvent<HTMLElement>) => onRefresh(parseInt(e.currentTarget.dataset.pathId))

  return (
    <Draggable draggableId={`path-${path.pathId}`} index={index}>
      {provided => (
        <div
          className={styles.pathItem}
          key={path.pathId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps} tabIndex={-1}>
            <Icon icon='DRAG_INDICATOR' className={styles.btnDrag} />
          </div>
          <div className={styles.pathName}>
            {path.path}
          </div>
          <Button
            className={styles.btnRefresh}
            data-path-id={path.pathId}
            icon='REFRESH'
            onClick={handleRefresh}
          />
          <Button
            className={styles.btnInfo}
            data-path-id={path.pathId}
            icon='INFO_OUTLINE'
            onClick={handleInfo}
          />
        </div>
      )}
    </Draggable>
  )
}

export default PathItem
