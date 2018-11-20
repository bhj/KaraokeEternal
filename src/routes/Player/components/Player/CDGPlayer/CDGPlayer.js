import PropTypes from 'prop-types'
import React from 'react'
import CDGraphics from 'cdgraphics'
import './CDGPlayer.css'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('media')

class CDGPlayer extends React.Component {
  static propTypes = {
    bgAlpha: PropTypes.number.isRequired,
    queueItem: PropTypes.object.isRequired,
    isErrored: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    onMediaElement: PropTypes.func.isRequired,
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  canvas = React.createRef()
  audio = React.createRef()
  state = { CDGBackgroundColor: null }

  componentDidMount () {
    this.cdg = new CDGraphics(this.canvas.current, {
      forceTransparent: true,
      onBackgroundChange: this.handleCDGBackgroundChange,
    })

    this.setVolume(this.props.volume)
    this.props.onMediaElement(this.audio.current, { isAlphaSupported: true })
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    const { queueItem, isErrored, isPlaying, volume } = this.props

    // item changed or re-trying errored?
    if (prevProps.queueItem.queueId !== queueItem.queueId ||
       (isErrored && !prevProps.isPlaying && isPlaying)) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== isPlaying) {
      this.updateIsPlaying()
    }

    this.setVolume(volume)
  }

  render () {
    const { bgAlpha, width, height } = this.props
    let style = {
      backgroundColor: 'transparent',
    }

    if (this.state.CDGBackgroundColor) {
      const [r, g, b, a] = this.state.CDGBackgroundColor
      style.backgroundColor = `rgba(${r},${g},${b},${bgAlpha})`
    }

    // cd graphics are chunky; scale to a max of 80% viewport height
    const vMaxScale = Math.floor((height * 0.8) / 216)
    const hMaxScale = Math.floor(width / 300)
    const scale = Math.min(vMaxScale, hMaxScale)

    return (
      <div styleName='container' style={style}>
        <canvas
          width={scale * 300}
          height={scale * 216}
          ref={this.canvas}
        />
        <br />
        <audio
          preload='none'
          onCanPlayThrough={this.updateIsPlaying}
          onTimeUpdate={this.handleAudioTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleAudioError}
          ref={this.audio}
        />
      </div>
    )
  }

  updateSources = () => {
    const { mediaId } = this.props.queueItem

    // media request(s) started
    this.props.onMediaRequest()

    // load .cdg file
    this.cdg.stop()
    this.isCDGLoaded = false

    api('GET', `/?type=cdg&mediaId=${mediaId}`)
      .then(res => res.arrayBuffer())
      .then(res => {
        this.cdg.load(new Uint8Array(res))

        // start loading audio
        this.audio.current.src = `/api/media/?type=audio&mediaId=${mediaId}`
        this.audio.current.load()
      }).catch(err => {
        this.props.onMediaRequestError(err.message)
      })
  }

  setVolume (vol) {
    this.audio.current.volume = vol
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      const promise = this.audio.current.play()

      if (typeof promise !== 'undefined') {
        promise.then(() => {
          this.cdg.play()
          this.props.onMediaRequestSuccess()
        }).catch(err => {
          this.props.onMediaRequestError(err.message)
        })
      }
    } else {
      this.audio.current.pause()
      this.cdg.stop()
    }
  }

  handleCDGBackgroundChange = color => {
    this.setState({ CDGBackgroundColor: color })
  }

  /**
 * <audio> event handlers
 */

  handleAudioTimeUpdate = () => {
    this.cdg.sync(this.audio.current.currentTime * 1000)

    // emit player status
    this.props.onStatus({
      position: this.audio.current.currentTime,
      volume: this.audio.current.volume,
    })
  }

  handleAudioError = (el) => {
    const { message, code } = el.target.error

    // media request failed
    this.props.onMediaRequestError(`${message} (code ${code})`)
  }
}

export default CDGPlayer
