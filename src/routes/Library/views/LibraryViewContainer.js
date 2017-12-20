import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const getMedia = (state) => state.media
const getView = (state) => state.library.view
const getSearchStr = (state) => state.library.searchStr
const getQueue = (state) => state.queue

const getVisibleArtists = createSelector(
  [getMedia, getView, getSearchStr],
  (media, view, searchStr) => {
    const artists = {
      result: [],
      entities: {},
    }

    for (const row of media) {
      // todo: are we searching/filtering?

      // new artist?
      if (typeof artists.entities[row.artistId] === 'undefined') {
        artists.result.push(row.artistId)
        artists.entities[row.artistId] = {
          artistId: row.artistId,
          name: row.artist,
          songs: [],
        }
      }

      artists.entities[row.artistId].songs.push(row)
    }

    return artists
  }
)

const getQueuedMediaIds = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId =>
    queue.entities[queueId].mediaId
  )
)

const mapStateToProps = (state) => {
  return {
    artists: getVisibleArtists(state),
    queuedMediaIds: getQueuedMediaIds(state),
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // search
    searchStr: state.library.searchStr,
    artistResults: state.library.artistSearchResult,
    songResults: state.library.songSearchResult,
    expandedArtistResults: state.library.expandedArtistResults,
  }
}

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  scrollArtists,
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
