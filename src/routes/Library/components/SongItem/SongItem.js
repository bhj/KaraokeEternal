import PropTypes from 'prop-types'
import React from 'react'
import Swipeable from 'react-swipeable'
import Icon from 'components/Icon'
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
    onSongStar: PropTypes.func.isRequired,
    onSongUnstar: PropTypes.func.isRequired,
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
  handleStar = () => this.props.onSongStar(this.props.songId)
  handleUnstar = () => this.props.onSongUnstar(this.props.songId)
  handleSwipeLeft = (e, delta) => this.setState({ isExpanded: this.props.isAdmin })
  handleSwipeRight = (e, delta) => this.setState({ isExpanded: false })
  handleInfo = () => this.props.onSongInfo(this.props.songId)

  render () {
    const { props } = this

    return (
      <Swipeable
        onSwipingLeft={this.handleSwipeLeft}
        onSwipingRight={this.handleSwipeRight}
        preventDefaultTouchmoveEvent
        style={props.style}
        styleName={props.artist ? 'containerExpanded' : 'container'}
      >
        <div styleName='duration'>
          {toMMSS(props.duration)}
        </div>

        <div onClick={this.handleQueue} styleName='primary'>
          <div styleName={props.isQueued ? 'title glow' : 'title'}>
            <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
            {props.isAdmin && props.numMedia > 1 && <i> ({props.numMedia})</i>}
            {props.artist && <div styleName='artist'>{props.artist}</div>}
          </div>
        </div>

        <div styleName={this.state.isExpanded ? 'btnContainerExpanded' : 'btnContainer'}>
          <div onClick={props.isStarred ? this.handleUnstar : this.handleStar} styleName='button'>
            <Icon size={44} icon={'STAR_FULL'} styleName={props.isStarred ? 'starStarred' : 'star'} />
            <div styleName={props.isStarred ? 'starCountStarred' : 'starCount'}>
              {props.numStars ? props.numStars : ''}
            </div>
          </div>
          <div onClick={this.handleInfo} styleName='button'>
            <Icon size={44} icon='INFO_OUTLINE' styleName='info' />
          </div>
        </div>
      </Swipeable>
    )
  }
}

// convert seconds to mm:ss
function toMMSS (duration) {
  const min = Math.floor(duration / 60)
  const sec = duration - (min * 60)
  return min + ':' + (sec < 10 ? '0' + sec : sec)
}
