import PropTypes from 'prop-types'
import React from 'react'
import Highlighter from 'react-highlight-words'
import Button from 'components/Button'
import Buttons from 'components/Buttons'
import Swipeable from 'components/Swipeable'
import ToggleAnimation from 'components/ToggleAnimation'
import { formatDuration } from 'lib/dateTime'
import styles from './SongItem.css'

let ignoreMouseup = false

export default class SongItem extends React.Component {
  static propTypes = {
    songId: PropTypes.number.isRequired,
    artist: PropTypes.string,
    title: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    style: PropTypes.object,
    onSongQueue: PropTypes.func.isRequired,
    onSongStarClick: PropTypes.func.isRequired,
    onSongInfo: PropTypes.func.isRequired,
    isQueued: PropTypes.bool.isRequired,
    isStarred: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    numStars: PropTypes.number.isRequired,
    numMedia: PropTypes.number.isRequired,
    filterKeywords: PropTypes.array.isRequired,
  }

  state = {
    isExpanded: false,
  }

  render () {
    const { props, state } = this

    return (
      <Swipeable
        onSwipedLeft={this.handleSwipedLeft}
        onSwipedRight={this.handleSwipedRight}
        preventDefaultTouchmoveEvent
        trackMouse
        style={{ height: props.artist ? 60 : 44 }}
        className={props.isQueued ? styles.containerQueued : styles.container}
      >

        <ToggleAnimation toggle={props.isQueued} className={styles.animateGlow}>
          <div className={styles.duration}>
            {formatDuration(props.duration)}
          </div>
          <div onClick={this.handleClick} className={styles.primary}>
            <div className={styles.title}>
              <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
              {props.isAdmin && props.numMedia > 1 && <i> ({props.numMedia})</i>}
              {props.artist && <div className={styles.artist}>{props.artist}</div>}
            </div>
          </div>
        </ToggleAnimation>

        <Buttons btnWidth={50} isExpanded={state.isExpanded}>
          <Button
            animateClassName={styles.animateStar}
            className={`${styles.btn} ${props.isStarred ? styles.starStarred : styles.star}`}
            onClick={this.handleStarClick}
            icon='STAR_FULL'
            size={44}
          >
            <div className={props.isStarred ? styles.starCountStarred : styles.starCount}>
              {props.numStars ? props.numStars : ''}
            </div>
          </Button>
          <Button
            className={`${styles.btn} ${styles.info}`}
            data-hide
            icon='INFO_OUTLINE'
            onClick={this.handleInfoClick}
            size={44}
          />
        </Buttons>
      </Swipeable>
    )
  }

  handleSwipedLeft = ({ event }) => {
    ignoreMouseup = event.type === 'mouseup'
    this.setState({ isExpanded: this.props.isAdmin })
  }

  handleSwipedRight = ({ event }) => {
    ignoreMouseup = event.type === 'mouseup'
    this.setState({ isExpanded: false })
  }

  handleClick = () => {
    ignoreMouseup ? ignoreMouseup = false : this.props.onSongQueue(this.props.songId)
  }

  handleStarClick = () => this.props.onSongStarClick(this.props.songId)
  handleInfoClick = () => this.props.onSongInfo(this.props.songId)
}
