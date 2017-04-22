import PropTypes from 'prop-types'
import React from 'react'
import YouTube from 'react-youtube'

class YouTubePlayer extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    song: PropTypes.object.isRequired,
    onMediaError: PropTypes.func.isRequired, // action
    onMediaEnd: PropTypes.func.isRequired, // action
    onStatus: PropTypes.func.isRequired, // action
  }

  componentWillUnmount () {
    clearInterval(this.statusTimer)
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (prevProps.volume !== this.props.volume) {
      this.setVolume(this.props.volume)
    }
  }

  render () {
    if (!this.state.videoId) return null

    const { width, height, song } = this.props
    const opts = {
      width,
      height,
      // https://developers.google.com/youtube/player_parameters
      playerVars: {
        autoplay: 1,
        // controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
      }
    }

    return (
      <div style={{ width, height }}>
        <YouTube
          videoId={song.providerData.videoId}
          opts={opts}
          onReady={this.handleReady}
          onStateChange={this.handleStatus}
          onError={this.handleError}
          onEnd={this.props.onMediaEnd}
        />
      </div>
    )
  }

  handleReady = (event) => {
    this.player = event.target
    event.target.setVolume(this.props.volume * 100) // flakey using this.player?
    clearInterval(this.statusTimer)
    this.statusTimer = setInterval(this.handleStatus, 1000)
  }

  handleError = (event) => {
    this.props.onMediaError('Error ' + event.data)
  }

  setVolume = (vol) => {
    this.player.setVolume(vol * 100)
  }

  handleStatus = (event) => {
    if (!event && !this.player) return
    const player = event ? event.target : this.player

    this.props.onStatus({
      isPlaying: player.getPlayerState() === 1,
      position: player.getCurrentTime(),
      volume: player.getVolume() / 100,
    })
  }

  updateIsPlaying = () => {
    if (!this.player) return

    if (this.props.isPlaying) {
      this.player.playVideo()
    } else {
      this.player.pauseVideo()
    }
  }
}

export default YouTubePlayer
