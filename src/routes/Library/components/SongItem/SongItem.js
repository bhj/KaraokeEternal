import PropTypes from 'prop-types'
import React from 'react'
import Highlighter from 'react-highlight-words'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
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
          <div onClick={this.handleStarClick} className={`${styles.btn} ${styles.star}`}>
            <ToggleAnimation toggle={props.isStarred} className={styles.animateStar}>
              <Icon size={44} icon={'STAR_FULL'} className={props.isStarred ? styles.starStarred : styles.star}/>
            </ToggleAnimation>
            <div className={props.isStarred ? styles.starCountStarred : styles.starCount}>
              {props.numStars ? props.numStars : ''}
            </div>
          </div>
          <div onClick={this.handleInfoClick} className={styles.btn} data-hide>
            <Icon size={44} icon='INFO_OUTLINE' className={`${styles.btn} ${styles.info}`}/>
          </div>
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
