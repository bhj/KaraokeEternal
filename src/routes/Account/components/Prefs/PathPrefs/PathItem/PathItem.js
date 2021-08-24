import PropTypes from 'prop-types'
import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import Icon from 'components/Icon'
import styles from './PathItem.css'

const PathItem = props => {
  const { path, pathId } = props.path

  return (
    <Draggable draggableId={`path-${pathId}`} index={props.index}>
      {(provided, snapshot) => (
        <div className={styles.pathItem}
          key={pathId}
          ref={provided.innerRef}
          style={provided.draggableProps.style}
          {...provided.draggableProps}
        >
          <div {...provided.dragHandleProps}>
            <Icon icon={'DRAG_INDICATOR'} size={24} className={styles.btnDrag} />
          </div>
          <div className={styles.pathName}>
            {path}
          </div>
          <div data-path-id={pathId} onClick={props.onRemove} className={styles.btnClear}>
            <Icon icon='CLEAR' size={32} />
          </div>
        </div>
      )}
    </Draggable>
  )
}

PathItem.propTypes = {
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
  path: PropTypes.object.isRequired,
}

export default PathItem
