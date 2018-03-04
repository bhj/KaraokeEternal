import PropTypes from 'prop-types'
import React from 'react'
import secToTime from 'lib/secToTime'
import './UpNext.css'

const UpNext = props => {
  const { value, unit } = secToTime(props.wait)

  return (
    <div styleName='container'>
      {props.isUpNow &&
        <p styleName='msg'>
          You&rsquo;re up!
        </p>
      }

      {props.isUpNext && !props.isUpNow &&
        <p styleName='msg'>
          You&rsquo;re next in {value}{unit}...
        </p>
      }
    </div>
  )
}

UpNext.propTypes = {
  isUpNow: PropTypes.bool.isRequired,
  isUpNext: PropTypes.bool.isRequired,
  wait: PropTypes.number.isRequired,
}

export default UpNext
