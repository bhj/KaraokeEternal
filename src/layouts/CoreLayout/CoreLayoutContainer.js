import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { closeSongInfo } from 'store/modules/songInfo'
import { clearErrorMessage } from 'store/modules/ui'

const mapStateToProps = (state) => {
  return {
    errorMessage: state.ui.errorMessage,
    songInfoId: state.songInfo.songId,
  }
}

const mapActionCreators = {
  clearErrorMessage,
  closeSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
