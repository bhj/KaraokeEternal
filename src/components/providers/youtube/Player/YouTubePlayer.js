import React, { PropTypes } from 'react'
import YouTube from 'react-youtube'

class YouTubePlayer extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    queueId: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
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

  componentDidUpdate (prevProps) {
    if (prevProps.queueId !== this.props.queueId) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    // if (prevProps.volume !== this.props.volume) {
    //   this.setVolume(this.props.volume)
    // }
  }

  updateSources = () => {
    // get videoId for song
    const url = '/api/song/'+this.props.item.songId

    fetch(url, fetchConfig)
      .then(checkStatus)
      .then(res => res.json())
      .then(song => {
        this.setState({videoId: song.videoId})
      })
      .catch((err) => {
        this.props.onMediaError(this.props.queueId, err.message)
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
        autoplay: 1
      }
    }

    return (
      <div style={{width, height}}>
        <YouTube
          videoId={this.state.videoId}
          opts={opts}
          onReady={this.handleOnReady}
          onError={this.handleAudioError}
        />
      </div>
    )
  }

  handleOnReady = (event) => {
    this.player = event.target
  }

//   setVolume(vol) {
//     this.audio.volume = vol
//   }
//
// /**
//  * <audio> event handlers
//  */
  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.player.playVideo()
    } else {
      this.player.pauseVideo()
    }
  }
//
//   handleOnTimeUpdate = () => {
//     this.setState({
//       audioPos: this.audio.currentTime * 1000
//     })
//
//     this.props.onStatus({
//       queueId: this.props.queueId,
//       isPlaying: !this.audio.paused,
//       position: this.audio.currentTime,
//       volume: this.audio.volume,
//     })
//   }
//
//   handleAudioError = (err) => {
//     this.props.onMediaError(this.props.queueId,
//       'The audio file could not be loaded (error code '+err.target.error.code+')'
//     )
//   }
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

function checkStatus(response) {
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
