import PropTypes from 'prop-types'
import React from 'react'
import secToTxt from 'lib/secToTxt'
import './UpNext.css'

const UpNext = props => (
  <div styleName='container'>
    {props.isUpNow &&
      <p styleName='msg'>
        You&rsquo;re up!
      </p>
    }

    {props.isUpNext && !props.isUpNow &&
      <p styleName='msg'>
        You&rsquo;re up next{props.wait ? ` in ${secToTxt(props.wait)}` : ''}...
      </p>
    }
  </div>
)

UpNext.propTypes = {
  isUpNow: PropTypes.bool.isRequired,
  isUpNext: PropTypes.bool.isRequired,
  wait: PropTypes.number.isRequired,
}

export default UpNext
