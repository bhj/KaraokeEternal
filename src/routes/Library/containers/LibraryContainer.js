import { connect } from 'react-redux'
import LibraryView from '../components/LibraryView'
import { queueSong } from '../../Queue/modules/queue'

const mapActionCreators = {
  queueSong
}

const mapStateToProps = (state) => ({
  ids: state.library.result,
  artists: state.library.entities
})

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
