import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import Button from 'components/Button/Button'
import Icon from 'components/Icon/Icon'
import { Path } from 'shared/types'
import styles from './PathItem.css'

interface PathItemProps {
  index: number
  onInfo: () => void
  onRefresh: (pathId: number) => void
  path: Path
}

const PathItem = (props: PathItemProps) => {
  const { path, pathId } = props.path

  return (
    <Draggable draggableId={`path-${pathId}`} index={props.index}>
      {(provided) => (
        <div className={styles.pathItem}
          key={pathId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps}>
            <Icon icon='DRAG_INDICATOR' size={24} className={styles.btnDrag} />
          </div>
          <div className={styles.pathName}>
            {path}
          </div>
          <Button
            className={styles.btnRefresh}
            data-path-id={pathId}
            icon='REFRESH'
            onClick={props.onRefresh}
            size={32}
          />
          <Button
            className={styles.btnInfo}
            data-path-id={pathId}
            icon='INFO_OUTLINE'
            onClick={props.onInfo}
            size={32}
          />
        </div>
      )}
    </Draggable>
  )
}

export default PathItem
