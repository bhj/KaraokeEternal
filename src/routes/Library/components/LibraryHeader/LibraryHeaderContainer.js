import { connect } from 'react-redux'
import LibraryHeader from './LibraryHeader'
import { searchLibrary } from '../../modules/library'

const mapActionCreators = {
  searchLibrary,
}

const mapStateToProps = (state) => {
  return {
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryHeader)
