import PropTypes from 'prop-types'
import React from 'react'
import YouTube from 'react-youtube'

class YouTubePlayer extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    // actions
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  componentWillUnmount () {
    clearInterval(this.statusTimer)
  }

  componentDidUpdate (prevProps, prevState) {
    this.updateIsPlaying()
    this.setVolume(this.props.volume)
  }

  render () {
    const { width, height, queueItem } = this.props
    if (!queueItem) return null

    const opts = {
      width: '100%',
      height: '100%',
      // https://developers.google.com/youtube/player_parameters
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
      }
    }

    return (
      <div style={{ width, height }}>
        <YouTube
          videoId={queueItem.providerData.videoId}
          opts={opts}
          onReady={this.handleReady}
          onStateChange={this.handleStateChange}
          onError={this.handleError}
          onEnd={this.props.onMediaEnd}
        />
      </div>
    )
  }

  handleReady = (event) => {
    this.player = event.target
    this.player.setVolume(this.props.volume * 100)

    this.updateIsPlaying()
  }

  handleStateChange = (event) => {
    switch (event.data) {
      case 1:
        // playing; need to poll position (vroom vroom!)
        clearInterval(this.statusTimer)
        this.statusTimer = setInterval(this.onStatus, 1000)
        break
      case 2:
        // paused; cancel polling
        clearInterval(this.statusTimer)
        break
      case 3:
        // buffering; not much we can do here
        return
      case 5:
        // cued; if we're playing, play!
        this.updateIsPlaying()
        break
    }

    // most codes trigger a status emit
    this.onStatus()
  }

  onStatus = () => {
    this.props.onStatus({
      position: this.player.getCurrentTime(),
      volume: this.player.getVolume() / 100,
    })
  }

  handleError = (event) => {
    // media request failed; stops playing
    this.props.onMediaRequestError(this.props.queueItem.mediaId, event.data)

    // emit error to room
    this.props.onError(event.data)
  }

  setVolume = (vol) => {
    this.player.setVolume(vol * 100)
  }

  updateIsPlaying = () => {
    if (this.player) {
      this.props.isPlaying ? this.player.playVideo() : this.player.pauseVideo()
    }
  }
}

export default YouTubePlayer
