import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { closeSongInfo } from 'store/modules/songInfo'
import { clearErrorMessage, setFooterHeight, setHeaderHeight } from 'store/modules/ui'

const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.user.userId !== null,
    loc: state.location.pathname,
    ui: state.ui,
  }
}

const mapActionCreators = {
  clearErrorMessage,
  closeSongInfo,
  setFooterHeight,
  setHeaderHeight,
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
