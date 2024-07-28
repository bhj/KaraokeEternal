import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { setFilterStr, resetFilterStr, toggleFilterStarred } from '../../modules/library'

const mapActionCreators = {
  setFilterStr,
  resetFilterStr,
  toggleFilterStarred,
}

const mapStateToProps = (state) => {
  return {
    filterStr: state.library.filterStr,
    filterStarred: state.library.filterStarred,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
