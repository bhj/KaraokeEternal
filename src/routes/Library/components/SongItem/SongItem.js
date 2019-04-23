import PropTypes from 'prop-types'
import React from 'react'
import { Swipeable } from 'react-swipeable'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import Buttons from 'components/Buttons'
import { formatDuration } from 'lib/dateTime'
import Highlighter from 'react-highlight-words'
import './SongItem.css'

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
        styleName={props.isQueued ? 'containerQueued' : 'container'}
      >
        <div styleName='duration'>
          {formatDuration(props.duration)}
        </div>

        <div onClick={this.handleClick} styleName='primary'>
          <div styleName='title'>
            <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
            {props.isAdmin && props.numMedia > 1 && <i> ({props.numMedia})</i>}
            {props.artist && <div styleName='artist'>{props.artist}</div>}
          </div>
        </div>

        <Buttons btnWidth={45} showHidden={state.isExpanded}>
          <div onClick={this.handleStarClick} styleName='btn star'>
            <ToggleAnimation toggle={props.isStarred} styleName='animateStar'>
              <Icon size={44} icon={'STAR_FULL'} styleName={props.isStarred ? 'starStarred' : 'star'}/>
            </ToggleAnimation>
            <div styleName={props.isStarred ? 'starCountStarred' : 'starCount'}>
              {props.numStars ? props.numStars : ''}
            </div>
          </div>
          <div onClick={this.handleInfoClick} styleName='btn' data-hide>
            <Icon size={44} icon='INFO_OUTLINE' styleName='btn info' />
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
