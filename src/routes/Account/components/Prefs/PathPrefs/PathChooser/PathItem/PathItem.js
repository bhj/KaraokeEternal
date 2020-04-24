import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './PathItem.css'

const PathItem = (props) => {
  return (
    <div styleName='container' onClick={props.onSelect}>
      <div>
        <Icon icon='FOLDER' size={28} styleName='folder' />
      </div>
      <div styleName='path'>
        {props.path}
      </div>
    </div>
  )
}

PathItem.propTypes = {
  path: PropTypes.string.isRequired,
  onSelect: PropTypes.func,
}

export default PathItem
