import { connect } from 'react-redux'
import LibraryView from '../components/LibraryView'

const mapActionCreators = {}

const mapStateToProps = (state) => ({
  ids: state.library.result,
  artists: state.library.entities
})

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
