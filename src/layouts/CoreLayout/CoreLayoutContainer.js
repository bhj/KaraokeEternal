import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { closeSongInfo } from 'store/modules/songInfo'
import { clearErrorMessage } from 'store/modules/ui'

const mapStateToProps = (state) => {
  return {
    browser: state.browser,
    errorMessage: state.ui.errorMessage,
    isLoggedIn: state.user.userId !== null,
    songInfoId: state.songInfo.songId,
    ui: state.ui,
  }
}

const mapActionCreators = {
  clearErrorMessage,
  closeSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
