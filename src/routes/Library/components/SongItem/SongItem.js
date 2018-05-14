import PropTypes from 'prop-types'
import React from 'react'
import Swipeable from 'react-swipeable'
import Icon from 'components/Icon'
import Highlighter from 'react-highlight-words'
import './SongItem.css'

const BTN_WIDTH = 44

export default class SongItem extends React.Component {
  static propTypes = {
    artist: PropTypes.string,
    title: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    style: PropTypes.object,
    onSongClick: PropTypes.func.isRequired,
    onSongStar: PropTypes.func.isRequired,
    onSongUnstar: PropTypes.func.isRequired,
    onSongInfoClick: PropTypes.func.isRequired,
    isQueued: PropTypes.bool.isRequired,
    isStarred: PropTypes.bool.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    numStars: PropTypes.number.isRequired,
    numMedia: PropTypes.number.isRequired,
    filterKeywords: PropTypes.array.isRequired,
  }

  state = {
    expanded: false,
  }

  handleSwipingLeft = (e, delta) => {
    this.setState({ expanded: true })
  }

  handleSwipingRight = (e, delta) => {
    this.setState({ expanded: false })
  }

  render () {
    const { props } = this
    const width = this.props.isAdmin && this.state.expanded ? BTN_WIDTH * 3 : BTN_WIDTH

    return (
      <Swipeable
        onSwipingLeft={this.handleSwipingLeft}
        onSwipingRight={this.handleSwipingRight}
        preventDefaultTouchmoveEvent
        style={props.style}
        styleName='container'
      >
        <div styleName='duration'>
          {toMMSS(props.duration)}
        </div>

        <div onClick={props.onSongClick} styleName='primary'>
          <div styleName={props.isQueued ? 'title glow' : 'title'}>
            <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
            {props.isAdmin && props.numMedia > 1 && <i> ({props.numMedia})</i>}
            {props.artist &&
              <div styleName='artist'>{props.artist}</div>
            }
          </div>
        </div>

        <div styleName='btnContainer' style={{ width }}>
          <div onClick={props.isStarred ? props.onSongUnstar : props.onSongStar} styleName='button'>
            <Icon size={44} icon={'STAR_FULL'} styleName={props.isStarred ? 'starStarred' : 'star'} />
            <div styleName={props.isStarred ? 'starCountStarred' : 'starCount'}>
              {props.numStars ? props.numStars : ''}
            </div>
          </div>
          <div onClick={props.onSongStarClick} styleName='button'>
            <Icon size={44} icon='VISIBILITY_OFF' styleName='hide' />
          </div>
          <div onClick={props.onSongInfoClick} styleName='button'>
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
