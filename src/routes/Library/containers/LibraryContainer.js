import { connect } from 'react-redux'
import LibraryView from '../components/LibraryView'

const mapActionCreators = {
}

const mapStateToProps = (state) => {
  return {
    searchTerm: state.library.searchTerm,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
