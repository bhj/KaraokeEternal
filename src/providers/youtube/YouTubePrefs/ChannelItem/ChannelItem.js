import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './ChannelItem.css'

const ChannelItem = (props) => {
  return (
    <div styleName='container'>
      <div>
        <i className='material-icons' styleName='channelIcon'>cloud</i>
      </div>
      <div styleName='name'>
        {props.name}
      </div>
      <div onClick={props.onRemoveClick}>
        <Icon icon='CLEAR' size={36} styleName='clear' />
      </div>
    </div>
  )
}

ChannelItem.propTypes = {
  name: PropTypes.string.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
}

export default ChannelItem
