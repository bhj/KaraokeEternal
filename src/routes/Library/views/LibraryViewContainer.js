import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const getArtists = (state) => state.library.artists
const getMedia = (state) => state.library.media
const getView = (state) => state.library.view
const getSearchStr = (state) => state.library.searchStr

const getVisibleArtists = createSelector(
  [getArtists, getView, getSearchStr],
  (artists, view, searchStr) => {
    let result = artist.result.slice()

    // return artists.result.filter(id => {
    //   const name = artists.entities[id].name.toLowerCase()
    //   return name.includes(searchStr)
    // })
    return result
  }
)

const getVisibleMedia = createSelector(
  [getMedia, getView, getSearchStr],
  (media, view, searchStr) => {
    let result = media.result.slice()

    // return media.result.filter((id, i) => {
    //   const title = media.entities[id].title.toLowerCase()
    //   return title.includes(searchStr)
    // })
    return result
  }
)

const mapStateToProps = (state) => {
  const queuedMediaIds = state.queue.result.map(queueId =>
    state.queue.entities[queueId].mediaId
  )

  return {
    artists: state.library.artists,
    media: state.library.media,
    queuedMediaIds,
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
