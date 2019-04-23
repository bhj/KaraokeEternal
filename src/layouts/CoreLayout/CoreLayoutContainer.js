import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { clearErrorMessage, closeSongInfo } from 'store/modules/ui'

const mapStateToProps = (state) => {
  return {
    errorMessage: state.ui.errorMessage,
    songInfoId: state.ui.songInfoId,
  }
}

const mapActionCreators = {
  clearErrorMessage,
  closeSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
