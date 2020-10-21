import React from 'react'
import { Link } from 'react-router-dom'
import './NoPlayer.css'

export const NoPlayer = (props) => (
  <div styleName='container'>
    <p styleName='msg'>
      No player in room (<Link to='/player'>Start Player</Link>)
    </p>
  </div>
)

export default NoPlayer
