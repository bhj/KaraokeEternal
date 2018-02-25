import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'

class Player extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // events
    onMediaEnd: PropTypes.func.isRequired,
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
    onMediaError: PropTypes.func.isRequired,
  }

  render () {
    const { provider } = this.props.queueItem

    if (!Providers[provider] || !Providers[provider].playerComponent) {
      return null
    }

    const ProviderPlayer = Providers[provider].playerComponent

    return (
      <ProviderPlayer {...this.props} />
    )
  }
}

export default Player
