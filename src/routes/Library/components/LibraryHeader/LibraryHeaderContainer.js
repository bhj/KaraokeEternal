import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { searchLibrary, searchReset } from '../../modules/library'

const mapActionCreators = {
  searchLibrary,
  searchReset,
}

const mapStateToProps = (state) => {
  return {
    searchTerm: state.library.searchTerm,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
