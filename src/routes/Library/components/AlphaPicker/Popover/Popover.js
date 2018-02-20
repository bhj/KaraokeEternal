import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './Popover.css'

export const LetterLabel = (props) => (
  <div styleName='container' style={{ top: props.y - 40 }}>
    <Icon size={80} icon='LABEL' styleName='icon' />
    <div styleName='char'>{props.char}</div>
  </div>
)

LetterLabel.propTypes = {
  y: PropTypes.number.isRequired,
  char: PropTypes.string.isRequired,
}

export default LetterLabel
