import AppLayout from './AppLayout'
import { connect } from 'react-redux'
import { setHeaderHeight, setFooterHeight, clearErrorMessage } from 'store/reducers/ui'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  setHeaderHeight,
  setFooterHeight,
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.account.user && state.account.user.isAdmin,
    errorMessage: state.ui.errorMessage,
    headerHeight: state.ui.headerHeight,
    footerHeight: state.ui.footerHeight,
    browserWidth: state.browser.width,
    browserHeight: state.browser.height,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AppLayout)
