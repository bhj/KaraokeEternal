import PropTypes from 'prop-types'
import React from 'react'
import Swipeable from 'react-swipeable'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import { formatSeconds } from 'lib/dateTime'
import Highlighter from 'react-highlight-words'
import './SongItem.css'

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

  handleQueue = () => this.props.onSongQueue(this.props.songId)
  handleStarClick = () => this.props.onSongStarClick(this.props.songId)
  handleSwipeLeft = (e, delta) => this.setState({ isExpanded: this.props.isAdmin })
  handleSwipeRight = (e, delta) => this.setState({ isExpanded: false })
  handleInfo = () => this.props.onSongInfo(this.props.songId)

  render () {
    const { props, state } = this

    return (
      <Swipeable
        onSwipingLeft={this.handleSwipeLeft}
        onSwipingRight={this.handleSwipeRight}
        preventDefaultTouchmoveEvent
        style={{ height: props.artist ? 60 : 44 }}
        styleName={props.isQueued ? 'containerQueued' : 'container'}
      >
        <div styleName='duration'>
          {formatSeconds(props.duration)}
        </div>

        <div onClick={this.handleQueue} styleName='primary'>
          <div styleName='title'>
            <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
            {props.isAdmin && props.numMedia > 1 && <i> ({props.numMedia})</i>}
            {props.artist && <div styleName='artist'>{props.artist}</div>}
          </div>
        </div>

        <div styleName={state.isExpanded ? 'btnContainerExpanded' : 'btnContainer'}>
          <div onClick={this.handleStarClick} styleName='btn'>
            <ToggleAnimation toggle={props.isStarred} styleName='animateStar'>
              <Icon size={44} icon={'STAR_FULL'} styleName={props.isStarred ? 'starStarred' : 'star'}/>
            </ToggleAnimation>
            <div styleName={props.isStarred ? 'starCountStarred' : 'starCount'}>
              {props.numStars ? props.numStars : ''}
            </div>
          </div>
          <div onClick={this.handleInfo} styleName={state.isExpanded ? 'btn' : 'btnHidden'}>
            <Icon size={44} icon='INFO_OUTLINE' styleName='info' />
          </div>
        </div>
      </Swipeable>
    )
  }
}
