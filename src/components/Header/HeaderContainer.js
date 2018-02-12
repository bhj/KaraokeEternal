import { connect } from 'react-redux'
import Header from './Header'
import { setHeaderHeight } from 'store/modules/ui'
import { requestScanCancel } from 'store/modules/providers'

const mapActionCreators = {
  setHeaderHeight,
  requestScanCancel,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
    isPlayer: state.location.pathname === '/player',
    isPlayerPresent: state.status.isPlayerPresent,
    isUpdating: state.providers.isUpdating,
    updateText: state.providers.updateText,
    updateProgress: state.providers.updateProgress,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
