import PropTypes from 'prop-types'
import React from 'react'
import classes from './PathItem.css'

const PathItem = (props) => {
  return (
    <div className={classes.container} onClick={props.onSelect}>
      <div>
        <i className={`material-icons ${classes.folder}`}>folder</i>
      </div>
      <div className={classes.path}>
        {props.path}
      </div>
      {props.isRemovable &&
        <div onClick={props.onRemoveClick}>
          <i className={`material-icons ${classes.remove}`}>clear</i>
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
