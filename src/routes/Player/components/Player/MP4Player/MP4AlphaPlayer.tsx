import React from 'react'
import GLChroma from 'gl-chromakey'
import styles from './MP4Player.css'

const BACKDROP_PADDING = 10 // px at 1:1 scale
const BORDER_RADIUS = parseInt(getComputedStyle(document.body).getPropertyValue('--border-radius'))

interface MP4AlphaPlayerProps {
  isPlaying: boolean
  mediaId: number
  mediaKey: number
  mp4Alpha: number
  width: number
  height: number
  onAudioElement(video: HTMLVideoElement): void
  // media events
  onEnd(): void
  onError(error: string): void
  onLoad(): void
  onPlay(): void
  onStatus(status: { position: number }): void
}

class MP4AlphaPlayer extends React.Component<MP4AlphaPlayerProps> {
  canvas = React.createRef<HTMLCanvasElement>()
  frameId: number | null = null
  video = document.createElement('video')
  chroma: GLChroma
  supportsFilters = CSS.supports('backdrop-filter', 'blur(10px) brightness(100%) saturate(100%)') || CSS.supports('-webkit-backdrop-filter', 'blur(10px) brightness(100%) saturate(100%)')
  state = {
    contentBounds: [0, 0, 0, 0], // x1, y1, x2, y2
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

    if (this.canvas.current) {
      this.chroma = new GLChroma(this.video, this.canvas.current)
      this.chroma.key({ color: 'auto' })
    }

    this.updateSources()
  }

  componentDidUpdate (prevProps: MP4AlphaPlayerProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (!this.props.isPlaying && (
      prevProps.width !== this.props.width
      || prevProps.height !== this.props.height
      || prevProps.mp4Alpha !== this.props.mp4Alpha)
    ) {
      const contentBounds = this.chroma.render({ passthrough: this.props.mp4Alpha === 1 }).getContentBounds()

      if (!contentBounds.every((val, i) => val === this.state.contentBounds[i])) {
        this.setState({ contentBounds })
      }
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
    const { mp4Alpha, width, height } = this.props
    const screenAspect = width / height
    const videoAspect = this.state.videoWidth / this.state.videoHeight
    const scale = screenAspect > videoAspect
      ? height / this.state.videoHeight
      : width / this.state.videoWidth
    const filters = []
    const [x1, y1, x2, y2] = this.state.contentBounds
    const pad = (x2 - x1) && (y2 - y1) ? scale * BACKDROP_PADDING : 0

    if (this.supportsFilters) {
      filters.push(`blur(${30 * mp4Alpha * scale}px)`)
      filters.push(`brightness(${100 - (100 * (mp4Alpha ** 3))}%)`)
      filters.push(`saturate(${100 - (100 * (mp4Alpha ** 3))}%)`)
    }

    return (
      <div className={styles.container}>
        <div
          className={styles.backdrop}
          style={{
            backdropFilter: this.supportsFilters && mp4Alpha !== 1 ? filters.join(' ') : 'none',
            borderRadius: BORDER_RADIUS * scale,
            left: x1 - pad,
            top: y1 - pad,
            width: (x2 - x1) + pad * 2,
            height: (y2 - y1) + pad * 2,
          }}
        >
        </div>
        <canvas
          className={styles.canvas}
          width={(this.state.videoWidth * scale) || 0}
          height={(this.state.videoHeight * scale) || 0}
          ref={this.canvas}
        />
      </div>

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
    this.video.src = `/api/media/${this.props.mediaId}?type=video`
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
    const contentBounds = this.chroma.render({ passthrough: this.props.mp4Alpha === 1 }).getContentBounds()

    // content bounds changed?
    if (!contentBounds.every((val, i) => val === this.state.contentBounds[i])) {
      this.setState({ contentBounds })
    }
  }

  stopChroma = () => cancelAnimationFrame(this.frameId)

  /*
  * <video> event handlers
  */
  handleEnded = () => {
    this.props.onEnd()
    this.stopChroma()
  }

  handleError = () => {
    const { message, code } = this.video.error
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

export default MP4AlphaPlayer
