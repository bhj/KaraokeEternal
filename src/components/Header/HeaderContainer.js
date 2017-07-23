import { connect } from 'react-redux'
import Header from './Header'
import { setHeaderHeight } from 'store/modules/ui'
import { requestScanCancel } from 'routes/Library/modules/library'

const mapActionCreators = {
  setHeaderHeight,
  requestScanCancel,
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
