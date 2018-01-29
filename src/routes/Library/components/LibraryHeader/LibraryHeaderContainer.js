import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { setFilterString, resetFilterString } from '../../modules/library'

const mapActionCreators = {
  setFilterString,
  resetFilterString,
}

const mapStateToProps = (state) => {
  return {
    filterString: state.library.filterString,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
