import React, { PropTypes } from 'react'
import fetch from 'isomorphic-fetch'
import CDGCanvas from './CDGCanvas'

class CDGPlayer extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    item: PropTypes.object.isRequired,
    getMedia: PropTypes.func.isRequired, // action
    getMediaSuccess: PropTypes.func.isRequired, // action
    getMediaError: React.PropTypes.func.isRequired, // action
  }

  state = {
    audioPos: 0, // ms
  }

  isAudioLoaded = false
  isCDGLoaded = false
  cdgData = []

  componentDidMount () {
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.item.id !== this.props.item.id) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  render () {
    // multiples of 300px
    const canvasWidth = Math.floor(this.props.width / 300) * 300

    return (
      <div>
        <audio src={'/api/provider/cdg/resource?type=audio&uid='+this.props.item.songUID}
          preload='none'
          onCanPlayThrough={this.handleOnCanPlayThrough}
          onTimeUpdate={this.handleOnTimeUpdate}
          onEnded={this.handleEnded}
          onError={this.handleAudioError}
          ref={(c) => {this.audio = c}}
          controls
        />
        <CDGCanvas
          width={canvasWidth}
          height={canvasWidth * .72}
          isPlaying={this.props.isPlaying}
          audioPos={this.state.audioPos}
          cdgData={this.cdgData}
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
    const url = '/api/provider/cdg/resource?type=cdg&uid='+this.props.item.songUID

    // notification
    this.props.getMedia(this.url)

    fetch(url, fetchConfig)
      .then(checkStatus)
      .then(res => res.arrayBuffer())
      .then(res => {
        // arrayBuffer to Uint8Array to standard Array
        this.cdgData = Array.from(new Uint8Array(res))
      }).then(() => { this.handleOnCdgLoaded() })
      .catch((error) => {
        this.props.getMediaError('error loading cdg data')
      })
  }

  handleEnded = () => {
    // @todo
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
  }

  handleAudioError = (err) => {
    // @todo better error message
    this.props.getMediaError('error loading audio')
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
