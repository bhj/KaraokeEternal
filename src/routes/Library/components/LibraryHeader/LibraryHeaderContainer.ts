import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { setFilterStr, resetFilterStr, toggleFilterStarred } from '../../modules/library'
import { RootState } from 'store/store'

const mapActionCreators = {
  setFilterStr,
  resetFilterStr,
  toggleFilterStarred,
}

const mapStateToProps = (state: RootState) => {
  return {
    filterStr: state.library.filterStr,
    filterStarred: state.library.filterStarred,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
