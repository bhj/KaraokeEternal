import PropTypes from 'prop-types'
import React from 'react'
import CDGPlayer from './CDGPlayer'
import MP4Player from './MP4Player'

const players = {
  CDGPlayer,
  MP4Player,
}

class Player extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // events
    onMediaElement: PropTypes.func.isRequired,
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  render () {
    const { player } = this.props.queueItem
    if (!player) return null

    const PlayerComponent = players[player.toUpperCase() + 'Player']

    if (typeof PlayerComponent === 'undefined') {
      this.props.onError(`Player component not found: ${player}`)
      return null
    }

    return (
      <PlayerComponent {...this.props} />
    )
  }
}

export default Player
