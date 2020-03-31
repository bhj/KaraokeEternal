import PropTypes from 'prop-types'
import React from 'react'
import CDGraphics from 'cdgraphics'
import './CDGPlayer.css'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('media')

class CDGPlayer extends React.Component {
  static propTypes = {
    alpha: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    queueItem: PropTypes.object.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioElement: PropTypes.func.isRequired,
    // actions
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

    this.props.onAudioElement(this.audio.current)
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.queueItem.queueId !== this.props.queueItem.queueId) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  render () {
    const { alpha, width, height } = this.props
    const style = {
      backgroundColor: 'transparent',
    }

    if (this.state.CDGBackgroundColor) {
      const [r, g, b, a] = this.state.CDGBackgroundColor // eslint-disable-line no-unused-vars
      style.backgroundColor = `rgba(${r},${g},${b},${alpha})`
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

    this.props.onStatus({ isAlphaSupported: true, position: 0 }, true)

    // media request(s) started
    this.props.onMediaRequest({ ...this.props.queueItem })

    // load .cdg file
    this.cdg.stop()
    this.isCDGLoaded = false

    api('GET', `/${mediaId}?type=cdg`)
      .then(res => res.arrayBuffer())
      .then(res => {
        this.cdg.load(new Uint8Array(res))

        // start loading audio
        this.audio.current.src = `/api/media/${mediaId}?type=audio`
        this.audio.current.load()
      }).catch(err => {
        this.props.onMediaRequestError(err.message)
      })
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
    })
  }

  handleAudioError = (el) => {
    const { message, code } = el.target.error

    // media request failed
    this.props.onMediaRequestError(`${message} (code ${code})`)
  }
}

export default CDGPlayer
