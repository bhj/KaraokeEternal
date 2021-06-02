import PropTypes from 'prop-types'
import React from 'react'
import GLChroma from 'gl-chromakey'

class MP4Player extends React.Component {
  static propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    mediaId: PropTypes.number.isRequired,
    mediaKey: PropTypes.number.isRequired,
    mp4Alpha: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioElement: PropTypes.func.isRequired,
    // media events
    onEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  canvas = React.createRef()
  frameId = null
  video = document.createElement('video')
  state = {
    videoWidth: 0,
    videoHeight: 0,
  }

  componentDidMount () {
    this.props.onAudioElement(this.video)
    this.video.oncanplaythrough = this.updateIsPlaying
    this.video.onended = this.handleEnded
    this.video.onerror = this.handleError
    this.video.onloadstart = this.props.onLoad
    this.video.onloadedmetadata = this.handleLoadedMetadata
    this.video.onplay = this.handlePlay
    this.video.ontimeupdate = this.handleTimeUpdate
    this.video.preload = 'auto'

    this.chroma = new GLChroma(this.video, this.canvas.current)
    this.chroma.key({ color: 'auto', amount: 1.0 - this.props.mp4Alpha })

    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (prevProps.mp4Alpha !== this.props.mp4Alpha) {
      this.chroma.key({ color: 'auto', amount: 1.0 - this.props.mp4Alpha })
    }
  }

  componentWillUnmount () {
    this.video.ontimeupdate = null
    this.video.pause()
    this.stopChroma()

    this.chroma.unload()
    this.video.removeAttribute('src')
    this.video.remove()
  }

  render () {
    const screenAspect = this.props.width / this.props.height
    const videoAspect = this.state.videoWidth / this.state.videoHeight
    const scale = screenAspect > videoAspect
      ? this.props.height / this.state.videoHeight
      : this.props.width / this.state.videoWidth

    return (
      <canvas
        width={(this.state.videoWidth * scale) || 0}
        height={(this.state.videoHeight * scale) || 0}
        ref={this.canvas}
      />
    )
  }

  handleLoadedMetadata = () => {
    this.setState({
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    })
  }

  updateSources = () => {
    this.stopChroma()
    this.video.src = `${document.baseURI}api/media/${this.props.mediaId}?type=video`
    this.video.load()
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.video.play()
        .catch(err => this.props.onError(err.message))
    } else {
      this.video.pause()
      this.stopChroma()
    }
  }

  startChroma = () => {
    this.frameId = requestAnimationFrame(this.startChroma)
    this.chroma.render()
  }

  stopChroma = () => cancelAnimationFrame(this.frameId)

  /*
  * <video> event handlers
  */
  handleEnded = (el) => {
    this.props.onEnd()
    this.stopChroma()
  }

  handleError = (el) => {
    const { message, code } = el.target.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePlay = () => {
    this.props.onPlay()
    this.startChroma()
  }

  handleTimeUpdate = () => {
    this.props.onStatus({
      position: this.video.currentTime,
    })
  }
}

export default MP4Player
