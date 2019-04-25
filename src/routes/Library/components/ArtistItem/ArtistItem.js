import PropTypes from 'prop-types'
import React from 'react'
import SongList from '../SongList'
import Icon from 'components/Icon'
import Highlighter from 'react-highlight-words'
import ToggleAnimation from 'components/ToggleAnimation'
import './ArtistItem.css'

class ArtistItem extends React.Component {
  static propTypes = {
    artistId: PropTypes.number.isRequired,
    artistSongIds: PropTypes.array.isRequired,
    filterKeywords: PropTypes.array.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    numStars: PropTypes.number.isRequired,
    queuedSongs: PropTypes.array.isRequired,
    starredSongs: PropTypes.array.isRequired,
    style: PropTypes.object,
    // actions
    onArtistClick: PropTypes.func.isRequired,
  }

  render () {
    const { props } = this
    const isChildQueued = props.artistSongIds.some(songId => props.queuedSongs.includes(songId))
    const isChildStarred = props.artistSongIds.some(songId => props.starredSongs.includes(songId))

    return (
      <div style={props.style}>
        <div onClick={this.handleArtistClick} styleName={props.isExpanded ? 'containerExpanded' : 'container'}>
          <div styleName={isChildStarred ? 'folderStarred' : 'folder'}>
            <Icon icon='FOLDER' size={44}/>
            {props.isExpanded &&
              <div styleName={isChildStarred ? 'iconExpandedStarred' : 'iconExpanded'}>
                <Icon icon='CHEVRON_DOWN' size={24} />
              </div>
            }
            {!props.isExpanded &&
              <div styleName='count'>{props.artistSongIds.length}</div>
            }
          </div>
          <ToggleAnimation toggle={isChildQueued} styleName='animateGlow'>
            <div styleName={isChildQueued ? 'name isChildQueued' : 'name'}>
              <Highlighter autoEscape textToHighlight={props.name} searchWords={props.filterKeywords} />
            </div>
          </ToggleAnimation>
        </div>

        {props.isExpanded &&
          <SongList
            songIds={props.artistSongIds}
            showArtist={false}
            filterKeywords={props.filterKeywords}
            queuedSongs={props.queuedSongs}
          />
        }
      </div>
    )
  }

  handleArtistClick = () => {
    this.props.onArtistClick(this.props.artistId)
  }
}

export default ArtistItem
