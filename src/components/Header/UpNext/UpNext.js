import PropTypes from 'prop-types'
import React from 'react'
import { formatSeconds } from 'lib/dateTime'
import './UpNext.css'

const UpNext = props => {
  if (props.isUpNow) {
    return (
      <div styleName='upNow'>
        <p styleName='msg'>
          You&rsquo;re up!
        </p>
      </div>
    )
  }

  if (props.isUpNext) {
    return (
      <div styleName='upNext'>
        <p styleName='msg'>
          You&rsquo;re next{props.wait ? ` in ${formatSeconds(props.wait)}` : '...'}
        </p>
      </div>
    )
  }
}

UpNext.propTypes = {
  isUpNow: PropTypes.bool.isRequired,
  isUpNext: PropTypes.bool.isRequired,
  wait: PropTypes.number.isRequired,
}

export default UpNext
