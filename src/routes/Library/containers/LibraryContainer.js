import { connect } from 'react-redux'
import LibraryView from '../components/LibraryView'
import { addSong } from '../../Queue/modules/queue'

const mapActionCreators = {
  addSong
}

const mapStateToProps = (state) => ({
  artistIds: state.library.artists.result,
  artists: state.library.artists.entities,
  songUIDs: state.library.songs.result,
  songs: state.library.songs.entities,
  // queue
  queue: state.queue
})

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
