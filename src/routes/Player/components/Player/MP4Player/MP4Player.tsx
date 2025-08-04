import React from 'react'
import styles from './MP4Player.css'

interface MP4PlayerProps {
  isPlaying: boolean
  mediaId: number
  mediaKey: number
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

class MP4Player extends React.Component<MP4PlayerProps> {
  video = React.createRef<HTMLVideoElement>()

  componentDidMount () {
    this.props.onAudioElement(this.video.current)
    this.updateSources()
  }

  componentDidUpdate (prevProps: MP4PlayerProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  render () {
    const { width, height } = this.props

    return (
      <video
        className={styles.video}
        preload='auto'
        width={width}
        height={height}
        onCanPlayThrough={this.updateIsPlaying}
        onEnded={this.props.onEnd}
        onError={this.handleError}
        onLoadStart={this.props.onLoad}
        onPlay={this.handlePlay}
        onTimeUpdate={this.handleTimeUpdate}
        ref={this.video}
      />
    )
  }

  updateSources = () => {
    this.video.current.src = `${document.baseURI}api/media/${this.props.mediaId}?type=video`
    this.video.current.load()
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.video.current.play()
        .catch(err => this.props.onError(err.message))
    } else {
      this.video.current.pause()
    }
  }

  /*
  * <video> event handlers
  */
  handleError = () => {
    const { message, code } = this.video.current.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePlay = () => this.props.onPlay()

  handleTimeUpdate = () => {
    if (!this.video.current) return

    this.props.onStatus({
      position: this.video.current.currentTime,
    })
  }
}

export default MP4Player
