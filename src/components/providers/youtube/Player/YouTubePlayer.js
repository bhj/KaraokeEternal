import React, { PropTypes } from 'react'
import YouTube from 'react-youtube'

class YouTubePlayer extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    song: PropTypes.object.isRequired,
    getMedia: PropTypes.func.isRequired, // action
    getMediaSuccess: PropTypes.func.isRequired, // action
    onMediaError: PropTypes.func.isRequired, // action
    onMediaEnd: PropTypes.func.isRequired, // action
    onStatus: PropTypes.func.isRequired, // action
  }

  state = {
    videoId: null
  }

  componentDidMount () {
    this.updateSources()
  }

  componentWillUnmount () {
    clearInterval(this.statusTimer)
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.song !== this.props.song) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying ||
        prevState.videoId !== this.state.videoId) {
      this.updateIsPlaying()
    }

    if (prevProps.volume !== this.props.volume) {
      this.setVolume(this.props.volume)
    }
  }

  updateSources = () => {
    // get videoId for song
    const url = '/api/song/' + this.props.song.songId

    fetch(url, fetchConfig)
      .then(checkStatus)
      .then(res => res.json())
      .then(song => {
        this.setState({ videoId: song.videoId })
      })
      .catch((err) => {
        this.props.onMediaError(err.message)
      })
  }

  render () {
    if (!this.state.videoId) return null

    const { width, height } = this.props
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
          videoId={this.state.videoId}
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

// helpers for fetch response
const fetchConfig = {
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  // include the cookie that contains our JWT
  credentials: 'same-origin'
}

function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    return response.text().then((txt) => {
      var error = new Error(txt)
      error.response = response
      throw error
    })
  }
}
