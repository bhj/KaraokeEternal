import React from 'react'

export const PlayerView = (props) => (
  <div>
    <h2>
      Player
    </h2>
    <button className='btn btn-default' onClick={props.play}>
      Play
    </button>
    {' '}
    <button className='btn btn-default' onClick={props.pause}>
      Pause
    </button>
  </div>
)

Counter.propTypes = {
  // counter: React.PropTypes.number.isRequired,
  play: React.PropTypes.func.isRequired,
  pause: React.PropTypes.func.isRequired
}

export default PlayerView
