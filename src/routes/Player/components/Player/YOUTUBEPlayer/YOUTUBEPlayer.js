import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import styles from './YOUTUBEPlayer.css'

class YOUTUBEPlayer extends React.Component {
  static minGapForProgress = 15 // num of secs of a gap between lines required to show a progress bar
  static gapPadding = 5 // num of secs before bringing the lyrics back after showing progress bar

  static propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    youtubeVideoId: PropTypes.string.isRequired,
    youtubeAlignedLyrics: PropTypes.array,
    youtubeVideoDuration: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioElement: PropTypes.func.isRequired,
    // media events
    onEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,

    upcomingLyricsColor: PropTypes.string,
    playedLyricsColor: PropTypes.string
  }

  state = {
    lyricsUpdateTimer: false
  }

  video = React.createRef()
  upcomingLyrics = React.createRef()
  playedLyrics = React.createRef()
  progressBar = React.createRef()

  previousCurrentLine = null
  gapStart = -1
  gapEnd = -1

  componentDidMount () {
    this.props.onAudioElement(this.video.current)
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.youtubeVideoId !== this.props.youtubeVideoId) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  renderLyricsLines () {
    return this.props.youtubeAlignedLyrics.map((line, i) =>
      <div key={this.props.youtubeVideoId + '_line_' + i} className={styles.line}>
        { this.renderLyricsWords(i, line) }
      </div>
    )
  }

  renderLyricsWords (lineNumber, words) {
    return words.map((wordData, i) =>
      <span key={this.props.youtubeVideoId + '_line_' + lineNumber + '_word_' + i} className={styles.wordContainer}>
        <span className={styles.word + ' ' + (wordData.ignore ? styles.wordIgnore : '')}>
          { wordData.word }
        </span>
      </span>
    )
  }

  render () {
    const { width, height } = this.props

    return (
      <>
        <video className={styles.video}
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
          // controls
          // style={{opacity:0.5, zIndex:1}}
        />
        { this.props.youtubeAlignedLyrics !== null &&
          <>
            <div key={this.props.youtubeVideoId + '_upcomingLyricsContainer'} style={{ width, height }} className={styles.lyricsContainer}>
              <div style={{ width }} className={styles.lyricsScrollContainer}>
                <div
                  ref={this.upcomingLyrics}
                  className={styles.lyrics + ' ' + styles.upcomingLyrics}
                  style={{ color:this.props.upcomingLyricsColor }}>
                  { this.renderLyricsLines() }
                </div>
                <div className={styles.endNotice}>
                  👏👏👏
                </div>
              </div>
            </div>
            <div key={this.props.youtubeVideoId + '_playedLyricsContainer'} style={{ width, height }} className={styles.lyricsContainer}>
              <div style={{ width }} className={styles.lyricsScrollContainer}>
                <div
                  ref={this.playedLyrics}
                  className={styles.lyrics + ' ' + styles.playedLyrics}
                  style={{ color:this.props.playedLyricsColor }}>
                  { this.renderLyricsLines() }
                </div>
              </div>
            </div>
            <div key={this.props.youtubeVideoId + '_progressBar'} ref={this.progressBar} style={{ width: width / 1.5 }} className={styles.progressBarContainer}>
              <div className={styles.progressBar}/>
            </div>
          </>
        }
      </>
    )
  }

  getFocusY () {
    return Math.floor(this.props.height / 2.5)
  }

  getLyricsEnd () {
    let lastLineWithWords = null
    for (let x = this.props.youtubeAlignedLyrics.length - 1; x >= 0; x--) {
      if (this.props.youtubeAlignedLyrics[x].length) {
        lastLineWithWords = this.props.youtubeAlignedLyrics[x]
        break
      }
    }

    if (lastLineWithWords === null) return this.props.youtubeVideoDuration
    return lastLineWithWords[lastLineWithWords.length - 1].end
  }

  /**
   * Calculates when this line ends (the start of the gap to the next line)
   */
  getGapStart (lineIndex) {
    if (lineIndex >= 0 && lineIndex < this.props.youtubeAlignedLyrics.length) {
      if (this.props.youtubeAlignedLyrics[lineIndex].length) {
        // this line has its own start/end, so just return its end...
        const words = this.props.youtubeAlignedLyrics[lineIndex]
        return words[words.length - 1].end
      } else {
        // this is a blank line, so return the end of the first line before it with words...
        for (let i = lineIndex - 1; i >= 0; i--) {
          if (this.props.youtubeAlignedLyrics[i].length) {
            const words = this.props.youtubeAlignedLyrics[i]
            return words[words.length - 1].end
          }
        }

        // this is a blank line at the beginning of the song...
        return 0
      }
    } else if (lineIndex === -2) { // after the final line
      return this.getGapStart(this.props.youtubeAlignedLyrics.length - 1)
    }

    // before the starting line
    return 0
  }

  /**
   * Calculates when the next line starts (the end of the gap to the next line)
   */
  getGapEnd (lineIndex) {
    if (lineIndex >= -1) lineIndex++

    if (lineIndex >= 0 && lineIndex < this.props.youtubeAlignedLyrics.length) {
      if (this.props.youtubeAlignedLyrics[lineIndex].length) {
        // this line has its own start/end, so just return its start...
        const words = this.props.youtubeAlignedLyrics[lineIndex]
        return words[0].start
      } else {
        // this is a blank line, so return the start of the first line after it with words...
        for (let i = lineIndex + 1; i < this.props.youtubeAlignedLyrics.length; i++) {
          if (this.props.youtubeAlignedLyrics[i].length) {
            const words = this.props.youtubeAlignedLyrics[i]
            return words[0].start
          }
        }
      }
    }

    // we're after the final line at the end of the song...
    return this.props.youtubeVideoDuration
  }

  /**
   * Returns the current line index.
   * Can also return -1 (if we're not to the first line yet), or -2 (if we're past the final line)
   */
  getCurrentLineIndex (currentTime) {
    let start = 0
    const index = this.props.youtubeAlignedLyrics.findIndex((words) => {
      if (words.length > 0) start = parseFloat(words[0].start)
      if (currentTime < start) return true
      if (words.length > 0) start = parseFloat(words[words.length - 1].end)
      return false
    })

    if (index >= 0) return index - 1
    if (index === -1) { // nothing was found, so we're either within the last line or past it
      if (currentTime < this.getLyricsEnd()) return this.props.youtubeAlignedLyrics.length - 1
      return -2
    }
    return 0
  }

  /**
   * This monolithic function updates the lyrics position, progress bar, etc.
   * It works, but could use a refactor. It's very React-averse.
   */
  updateLyricsPosition (currentTime = null) {
    if (this.props.youtubeAlignedLyrics !== null && this.video.current) {
      const duration = this.props.youtubeVideoDuration
      if (currentTime === null) currentTime = this.video.current.currentTime + 0.2
      if (currentTime > duration) currentTime = duration
      let currentLineIndex = this.getCurrentLineIndex(currentTime)

      // if the current line has changed, we'll need to do more, but this won't happen every frame...
      if (this.previousCurrentLine !== currentLineIndex) {
        this.previousCurrentLine = currentLineIndex

        // calculate the gap between the end of this line and the start of the next. If the gap
        // is long enough, we'll be setup to show a progress bar...
        // if we're past the last line, we don't calculate a gap at all (we don't want to
        // show a progress bar after the song has been sung)
        this.gapStart = this.getGapStart(currentLineIndex)
        this.gapEnd = this.getGapEnd(currentLineIndex)
        if (this.gapEnd - this.gapStart >= YOUTUBEPlayer.minGapForProgress && currentLineIndex !== -2) {
          this.gapEnd -= YOUTUBEPlayer.gapPadding
        } else {
          this.gapStart = -1
          this.gapEnd = -1
        }

        if (currentLineIndex === -1) { // we haven't started the first line yet
          currentLineIndex = 0
        }

        if (currentLineIndex === -2) { // we're past the last line
          currentLineIndex = this.props.youtubeAlignedLyrics.length - 1 // focus the last line
          this.upcomingLyrics.current.parentElement.parentElement.style.opacity = 0
          this.playedLyrics.current.parentElement.parentElement.style.opacity = 0
        } else {
          this.upcomingLyrics.current.parentElement.parentElement.style.opacity = 1
          this.playedLyrics.current.parentElement.parentElement.style.opacity = 1
        }

        const focusY = this.getFocusY()
        const lineY = this.upcomingLyrics.current.children[currentLineIndex].offsetTop
        this.upcomingLyrics.current.parentElement.style.top = (focusY - lineY) + 'px'
        this.playedLyrics.current.parentElement.style.top = (focusY - lineY) + 'px'

        // make sure the current line is visible...
        this.playedLyrics.current.children[currentLineIndex].style.visibility = 'visible'
        this.playedLyrics.current.children[currentLineIndex].style.opacity = 1
        this.upcomingLyrics.current.children[currentLineIndex].style.visibility = 'visible'
        this.upcomingLyrics.current.children[currentLineIndex].style.opacity = 1

        // make all later lines visible and reset their played word widths...
        for (let i = currentLineIndex + 1; i < this.props.youtubeAlignedLyrics.length; i++) {
          for (let wordIndex = 0; wordIndex < this.playedLyrics.current.children[i].children.length; wordIndex++) {
            this.playedLyrics.current.children[i].children[wordIndex].firstChild.style.width = '0%'
          }
          this.playedLyrics.current.children[i].style.visibility = 'visible'
          this.playedLyrics.current.children[i].style.opacity = 1
          this.upcomingLyrics.current.children[i].style.visibility = 'visible'
          this.upcomingLyrics.current.children[i].style.opacity = 1
        }

        // update preceeding line opacity and all word widths...
        if ((currentLineIndex - 1) >= 0) {
          for (let wordIndex = 0; wordIndex < this.playedLyrics.current.children[currentLineIndex - 1].children.length; wordIndex++) {
            this.playedLyrics.current.children[currentLineIndex - 1].children[wordIndex].firstChild.style.width = '100%'
          }
          this.upcomingLyrics.current.children[currentLineIndex - 1].style.visibility = 'visible'
          this.playedLyrics.current.children[currentLineIndex - 1].style.visibility = 'visible'
          this.playedLyrics.current.children[currentLineIndex - 1].style.opacity = 0.8
          this.upcomingLyrics.current.children[currentLineIndex - 1].style.opacity = 0.8
        }

        // update a few preceeding line's opacity...
        if ((currentLineIndex - 2) >= 0) {
          this.upcomingLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.playedLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.upcomingLyrics.current.children[currentLineIndex - 2].style.opacity = 0.6
          this.playedLyrics.current.children[currentLineIndex - 2].style.opacity = 0.6
        }
        if ((currentLineIndex - 3) >= 0) {
          this.upcomingLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.playedLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.upcomingLyrics.current.children[currentLineIndex - 3].style.opacity = 0.3
          this.playedLyrics.current.children[currentLineIndex - 3].style.opacity = 0.3
        }
        if ((currentLineIndex - 4) >= 0) {
          this.upcomingLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.playedLyrics.current.children[currentLineIndex - 2].style.visibility = 'visible'
          this.upcomingLyrics.current.children[currentLineIndex - 4].style.opacity = 0
          this.playedLyrics.current.children[currentLineIndex - 4].style.opacity = 0
        }

        // just hide the rest of the preceeding lines
        for (let i = 0; i < currentLineIndex - 5; i++) {
          this.upcomingLyrics.current.children[i].style.visibility = 'hidden'
          this.playedLyrics.current.children[i].style.visibility = 'hidden'
        }
      }

      // update the played portion of words in the current line...
      if (currentLineIndex === -1) currentLineIndex = 0
      if (currentLineIndex === -2) currentLineIndex = this.props.youtubeAlignedLyrics.length - 1

      const words = this.props.youtubeAlignedLyrics[currentLineIndex]
      if (words.length) {
        words.forEach((word, wordIndex) => {
          // calculate percentage played of this word...
          const wordStart = parseFloat(word.start)
          const wordEnd = parseFloat(word.end)
          let wordProgress = 0
          if (currentTime >= wordEnd) {
            wordProgress = 100
          } else if (currentTime >= wordStart) {
            const wordDuration = wordEnd - wordStart
            if (wordDuration > 0) {
              wordProgress = (((currentTime - wordStart) / wordDuration) * 100)
            }
          }

          if (this.playedLyrics.current.children[currentLineIndex] !== undefined &&
            this.playedLyrics.current.children[currentLineIndex].children[wordIndex] !== undefined) {
            this.playedLyrics.current.children[currentLineIndex]
              .children[wordIndex].firstChild.style.width = wordProgress + '%'
          }
        })
      }

      // show a progress bar if we're in the gap...
      if (this.gapStart !== -1) {
        if (currentTime >= this.gapStart && currentTime < this.gapEnd) {
          this.upcomingLyrics.current.parentElement.parentElement.style.opacity = 0
          this.playedLyrics.current.parentElement.parentElement.style.opacity = 0
          this.progressBar.current.style.opacity = 1
          this.progressBar.current.firstChild.style.width = ((((currentTime) - (this.gapStart + 1)) / (this.gapEnd - (this.gapStart + 1))) * 100) + '%'
        } else {
          this.progressBar.current.firstChild.style.width = '100%'
          this.upcomingLyrics.current.parentElement.parentElement.style.opacity = 1
          this.playedLyrics.current.parentElement.parentElement.style.opacity = 1
          this.progressBar.current.style.opacity = 0
        }
      }
    }
  }

  startLyricsTimer () {
    if (!this.state.lyricsUpdateTimer && this.props.youtubeAlignedLyrics !== null) {
      this.setState({ lyricsUpdateTimer: setInterval(this.updateLyricsPosition.bind(this), 100) })
    }
  }

  stopLyricsTimer () {
    if (this.state.lyricsUpdateTimer) {
      clearInterval(this.state.lyricsUpdateTimer)
      this.setState({ lyricsUpdateTimer: false })
    }
  }

  updateSources = () => {
    this.stopLyricsTimer()
    this.setState({ currentTime: 0.0 })
    this.video.current.src = `${document.baseURI}api/youtube/${this.props.youtubeVideoId}`
    this.video.current.load()
    this.previousCurrentLine = null
    this.startLyricsTimer()
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.video.current.play()
        .catch(err => this.props.onError(err.message))
      this.startLyricsTimer()
    } else {
      this.video.current.pause()
      this.stopLyricsTimer()
    }
  }

  /*
  * <video> event handlers
  */
  handleError = (el) => {
    const { message, code } = el.target.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePlay = () => this.props.onPlay()

  handleTimeUpdate = () => {
    this.props.onStatus({
      position: this.video.current.currentTime,
    })
  }
}

const mapStateToProps = state => {
  return {
    upcomingLyricsColor: state.prefs.upcomingLyricsColor,
    playedLyricsColor: state.prefs.playedLyricsColor
  }
}

export default connect(mapStateToProps)(YOUTUBEPlayer)
