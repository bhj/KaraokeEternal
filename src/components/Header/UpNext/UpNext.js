import PropTypes from 'prop-types'
import React from 'react'
import { formatSeconds } from 'lib/dateTime'
import './UpNext.css'

const UpNext = props => {
  if (props.isUpNow) {
    return (
      <div styleName='upNow'>
        <p styleName='msg'>
          You&rsquo;re up <strong>now</strong>
        </p>
      </div>
    )
  }

  if (props.isUpNext) {
    return (
      <div styleName='upNext'>
        <p styleName='msg'>
          You&rsquo;re up <strong>next</strong>{props.wait ? ` in ${formatSeconds(props.wait, true)}` : ''}
        </p>
      </div>
    )
  }

  if (props.wait) {
    return (
      <div styleName='inQueue'>
        <p styleName='msg'>
          You&rsquo;re up in {formatSeconds(props.wait, true)}
        </p>
      </div>
    )
  }

  return null
}

UpNext.propTypes = {
  isUpNow: PropTypes.bool.isRequired,
  isUpNext: PropTypes.bool.isRequired,
  wait: PropTypes.number,
}

export default UpNext
