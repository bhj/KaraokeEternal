import { connect } from 'react-redux'
import Header from './Header'
import { setHeaderHeight } from 'store/modules/ui'
import { cancelUpdate } from 'routes/Library/modules/library'

const mapActionCreators = {
  setHeaderHeight,
  cancelUpdate,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
    isUpdating: state.library.isUpdating,
    updateText: state.library.updateText,
    updateProgress: state.library.updateProgress,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
