import PropTypes from 'prop-types'
import React from 'react'
import CDGPlayer from './CDGPlayer'

class Player extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // events
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  render () {
    // if (!Providers[provider] || !Providers[provider].playerComponent) {
    //   this.props.onError(`Provider not found: ${provider}`)
    //   return null
    // }
    return (
      <CDGPlayer {...this.props} />
    )
  }
}

export default Player
