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
    showArtist: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    style: PropTypes.object,
    onSongClick: PropTypes.func.isRequired,
    onSongStarClick: PropTypes.func.isRequired,
    isQueued: PropTypes.bool.isRequired,
    isStarred: PropTypes.bool.isRequired,
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

    return (
      <Swipeable
        onSwipingLeft={this.handleSwipingLeft}
        onSwipingRight={this.handleSwipingRight}
        preventDefaultTouchmoveEvent
        style={props.style}
        styleName={'container' + (props.isQueued ? ' isQueued' : '')}
      >
        <div styleName='duration'>
          {toMMSS(props.duration)}
        </div>

        <div onClick={props.onSongClick} styleName='title'>
          <div styleName='title'>
            <Highlighter autoEscape textToHighlight={props.title} searchWords={props.filterKeywords} />
            {props.numMedia > 1 && <i>({props.numMedia})</i>}
            {props.showArtist &&
              <div styleName='artist'>{props.artist}</div>
            }
          </div>
        </div>

        <div styleName='btnContainer'
          style={{ width: this.state.expanded ? BTN_WIDTH * 3 + 'px' : BTN_WIDTH + 'px' }}
        >
          <div onClick={props.onSongStarClick} styleName='button'>
            <Icon size={44} icon={'STAR_FULL'} styleName={props.isStarred ? 'starStarred' : 'star'}
            />
            <div styleName={props.isStarred ? 'starCountStarred' : 'starCount'}>{props.numStars}</div>
          </div>
          <div onClick={props.onSongStarClick} styleName='button'>
            <Icon size={44} icon='VISIBILITY_OFF' styleName='hide' />
          </div>
          <div onClick={props.onSongStarClick} styleName='button'>
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
