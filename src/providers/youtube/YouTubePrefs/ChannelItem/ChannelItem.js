import PropTypes from 'prop-types'
import React from 'react'
import './ChannelItem.css'

const ChannelItem = (props) => {
  return (
    <div styleName='container'>
      <div>
        <i className='material-icons' styleName='folder'>folder</i>
      </div>
      <div styleName='name'>
        {props.name}
      </div>
      <div onClick={props.onRemoveClick}>
        <i className='material-icons' styleName='remove'>clear</i>
      </div>
    </div>
  )
}

ChannelItem.propTypes = {
  name: PropTypes.string.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
}

export default ChannelItem
