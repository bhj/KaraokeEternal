import PropTypes from 'prop-types'
import React from 'react'
import CDGraphics from 'cdgraphics'
import HttpApi from 'lib/HttpApi'
import styles from './CDGPlayer.css'

const api = new HttpApi('media')
const BACKDROP_PADDING = 5 // px at 1:1 scale
const BORDER_RADIUS = parseInt(getComputedStyle(document.body).getPropertyValue('--border-radius'))

class CDGPlayer extends React.Component {
  static propTypes = {
    cdgAlpha: PropTypes.number.isRequired,
    cdgSize: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    mediaId: PropTypes.number.isRequired,
    mediaKey: PropTypes.number.isRequired,
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

  audio = React.createRef()
  canvas = React.createRef()
  frameId = null
  supportsFilters = CSS.supports('backdrop-filter', 'blur(10px) brightness(100%) saturate(100%)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(10px) brightness(100%) saturate(100%)')

  state = {
    backgroundRGBA: [0, 0, 0, 0],
    contentBounds: [0, 0, 0, 0], // x1, y1, x2, y2
  }

  componentDidMount () {
    this.canvasCtx = this.canvas.current.getContext('2d')
    this.cdg = new CDGraphics()

    this.props.onAudioElement(this.audio.current)
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
      return
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (prevProps.width !== this.props.width ||
        prevProps.height !== this.props.height ||
        prevProps.cdgSize !== this.props.cdgSize) {
      if (this.lastBitmap) this.paintCDG(this.lastBitmap)
    }
  }

  componentWillUnmount () {
    this.stopCDG()
  }

  render () {
    const { cdgAlpha, cdgSize, width, height } = this.props
    const [x1, y1, x2, y2] = this.state.contentBounds
    const [r, g, b, a] = this.state.backgroundRGBA // eslint-disable-line no-unused-vars
    const filters = []

    // apply sizing as % of max height, leaving room for the backdrop
    const wScale = (width - (BACKDROP_PADDING * 2)) / 300
    const hScale = ((height - (BACKDROP_PADDING * 2)) * cdgSize) / 216
    const scale = Math.min(wScale, hScale)
    const pad = (x2 - x1) && (y2 - y1) ? BACKDROP_PADDING : 0

    if (this.supportsFilters) {
      filters.push(`blur(${30 * cdgAlpha * scale}px)`)
      filters.push(`brightness(${100 - (100 * (cdgAlpha ** 3))}%)`)
      filters.push(`saturate(${100 - (100 * (cdgAlpha ** 3))}%)`)
    }

    return (
      <div className={styles.container}>
        <div className={styles.backdrop} style={{
          backdropFilter: this.supportsFilters && cdgAlpha !== 1 ? filters.join(' ') : 'none',
          backgroundColor: this.supportsFilters && cdgAlpha !== 1 ? 'transparent' : `rgba(${r},${g},${b},${cdgAlpha})`,
          borderRadius: BORDER_RADIUS * scale,
          left: (x1 - pad) * scale,
          top: (y1 - pad) * scale,
          width: ((x2 - x1) + pad * 2) * scale,
          height: ((y2 - y1) + pad * 2) * scale,
        }}></div>
        <canvas
          ref={this.canvas}
          className={styles.canvas}
          width={300 * scale}
          height={216 * scale}
        />
        <br />
        <audio
          preload='auto'
          onCanPlayThrough={this.updateIsPlaying}
          onEnded={this.handleEnded}
          onError={this.handleError}
          onLoadStart={this.props.onLoad}
          onPlay={this.handlePlay}
          onTimeUpdate={this.handleTimeUpdate}
          ref={this.audio}
        />
      </div>
    )
  }

  updateSources = () => {
    this.stopCDG()

    // load .cdg file
    api('GET', `/${this.props.mediaId}?type=cdg`)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        this.cdg.load(buffer)
        this.audio.current.src = `${document.baseURI}api/media/${this.props.mediaId}?type=audio`
        this.audio.current.load()
      }).catch(err => {
        this.props.onError(err.message)
      })
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.audio.current.play()
        .catch(err => this.props.onError(err.message))
    } else {
      this.audio.current.pause()
      this.stopCDG()
    }
  }

  /*
  * <audio> event handlers
  */
  handleEnded = (el) => {
    this.props.onEnd()
    this.stopCDG()
  }

  handleError = (el) => {
    const { message, code } = el.target.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePlay = () => {
    this.props.onPlay()
    this.startCDG()
  }

  handleTimeUpdate = () => {
    this.props.onStatus({
      position: this.audio.current.currentTime,
    })
  }

  /*
  * CDGraphics rendering
  */
  paintCDG = bitmap => {
    const { clientWidth, clientHeight } = this.canvas.current

    this.canvasCtx.imageSmoothingEnabled = false
    this.canvasCtx.shadowBlur = Math.min(16, clientHeight * this.props.cdgSize * 0.0333)
    this.canvasCtx.shadowColor = 'rgba(0,0,0,1)'
    this.canvasCtx.clearRect(0, 0, clientWidth, clientHeight)
    this.canvasCtx.drawImage(bitmap, 0, 0, clientWidth, clientHeight)
  }

  startCDG = () => {
    this.frameId = requestAnimationFrame(this.startCDG)
    const frame = this.cdg.render(this.audio.current.currentTime, { forceKey: true })
    if (!frame.isChanged) return

    // background color changed?
    if (!frame.backgroundRGBA.every((val, i) => val === this.state.backgroundRGBA[i])) {
      this.setState({ backgroundRGBA: frame.backgroundRGBA })
    }

    // content bounds changed?
    if (!frame.contentBounds.every((val, i) => val === this.state.contentBounds[i])) {
      this.setState({ contentBounds: frame.contentBounds })
    }

    createImageBitmap(frame.imageData)
      .then(bitmap => {
        this.lastBitmap = bitmap // cache for re-painting if canvas size changes
        this.paintCDG(bitmap)
      })
  }

  stopCDG = () => cancelAnimationFrame(this.frameId)
}

export default CDGPlayer
