import React, { PropTypes } from 'react'
import CDGCanvas from './CDGCanvas'
import classes from './CDGPlayer.css'

class CDGPlayer extends React.Component {
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
    audioPos: 0, // ms
  }

  isAudioLoaded = false
  isCDGLoaded = false
  cdgData = []

  componentDidMount () {
    this.updateSources()
    this.setVolume(this.props.volume)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.song !== this.props.song) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (prevProps.volume !== this.props.volume) {
      this.setVolume(this.props.volume)
    }
  }

  render () {
    const { width, height } = this.props
    let canvasScale = Math.floor(width / 300)

    // make sure height would fit the viewport's
    while (height < canvasScale * 300 * 0.72) {
      canvasScale -= 1
    }

    return (
      <div style={{ width, height }} className={classes.background}>
        <CDGCanvas
          width={canvasScale * 300}
          height={canvasScale * 300 * 0.72}
          isPlaying={this.props.isPlaying}
          audioPos={this.state.audioPos}
          cdgData={this.cdgData}
        />
        <br />
        <audio src={'/api/provider/cdg/resource?type=audio&songId=' + this.props.song.songId}
          preload='none'
          onCanPlayThrough={this.handleOnCanPlayThrough}
          onTimeUpdate={this.handleOnTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleAudioError}
          ref={(c) => { this.audio = c }}
        />
      </div>
    )
  }

  updateSources = () => {
    // notification
    this.props.getMedia(this.audio.src)

    // tell audio element its source updated
    this.audio.load()

    // get cdgData
    const url = '/api/provider/cdg/resource?type=cdg&songId=' + this.props.song.songId

    // notification
    this.props.getMedia(this.url)

    fetch(url, fetchConfig)
      .then(checkStatus)
      .then(res => res.arrayBuffer())
      .then(res => {
        // arrayBuffer to Uint8Array to standard Array
        this.cdgData = Array.from(new Uint8Array(res))
      }).then(() => { this.handleOnCdgLoaded() })
      .catch((err) => {
        this.props.onMediaError(err.message)
      })
  }

  setVolume (vol) {
    this.audio.volume = vol
  }

/**
 * <audio> event handlers
 */
  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.audio.play()
    } else {
      this.audio.pause()
    }
  }

  handleOnCanPlayThrough = () => {
    this.isAudioLoaded = true

    if (this.isCDGLoaded) {
      this.props.getMediaSuccess()
      this.updateIsPlaying()
    }
  }

  handleOnTimeUpdate = () => {
    this.setState({
      audioPos: this.audio.currentTime * 1000
    })

    this.props.onStatus({
      isPlaying: !this.audio.paused,
      position: this.audio.currentTime,
      volume: this.audio.volume,
    })
  }

  handleAudioError = (err) => {
    this.props.onMediaError('Could not load audio (error ' + err.target.error.code + ')')
  }

  /**
   * CDGPlayer event handlers
   */
  handleOnCdgLoaded = () => {
    this.isCDGLoaded = true

    if (this.isAudioLoaded) {
      this.props.getMediaSuccess()
      this.updateIsPlaying()
    }
  }
}

export default CDGPlayer

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
