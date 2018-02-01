import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { setFilterString, resetFilterString, toggleFilterStarred } from '../../modules/library'

const mapActionCreators = {
  setFilterString,
  resetFilterString,
  toggleFilterStarred,
}

const mapStateToProps = (state) => {
  return {
    filterString: state.library.filterString,
    filterStarred: state.library.filterStarred,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
