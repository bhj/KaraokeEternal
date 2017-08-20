import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './PathItem.css'

const PathItem = (props) => {
  return (
    <div styleName='container' onClick={props.onSelect}>
      <div>
        <Icon icon='FOLDER' size={32} styleName='folder' />
      </div>
      <div styleName='path'>
        {props.path}
      </div>
      {props.isRemovable &&
        <div onClick={props.onRemoveClick}>
          <Icon icon='CLEAR' size={40} styleName='clear' />
        </div>
      }
    </div>
  )
}

PathItem.propTypes = {
  path: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
  isRemovable: PropTypes.bool,
  onRemoveClick: PropTypes.func,
}

export default PathItem
