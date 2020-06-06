import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { closeSongInfo } from 'store/modules/songInfo'
import { clearErrorMessage } from 'store/modules/ui'

const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.user.userId !== null,
    ui: state.ui,
  }
}

const mapActionCreators = {
  clearErrorMessage,
  closeSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
