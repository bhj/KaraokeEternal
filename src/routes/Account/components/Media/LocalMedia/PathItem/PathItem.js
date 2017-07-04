import PropTypes from 'prop-types'
import React from 'react'
import './PathItem.css'

const PathItem = (props) => {
  return (
    <div styleName='container' onClick={props.onSelect}>
      <div>
        <i className='material-icons' styleName='folder'>folder</i>
      </div>
      <div styleName='path'>
        {props.path}
      </div>
      {props.isRemovable &&
        <div onClick={props.onRemoveClick}>
          <i className='material-icons' styleName='remove'>clear</i>
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
