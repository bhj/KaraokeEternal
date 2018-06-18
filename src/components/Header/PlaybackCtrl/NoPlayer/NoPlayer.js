import React from 'react'
import { Link } from 'react-router'
import './NoPlayer.css'

export const NoPlayer = (props) => (
  <div styleName='container'>
    <p styleName='msg'>
      Player not found in room (<Link to='/player'>Start Player</Link>)
    </p>
  </div>
)

export default NoPlayer
