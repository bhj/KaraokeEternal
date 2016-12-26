import AppLayout from './AppLayout'
import { connect } from 'react-redux'
import { clearErrorMessage } from 'store/ui'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.account.user && state.account.user.isAdmin,
    errorMessage: state.ui.errorMessage,
    browserWidth: state.browser.width,
    browserHeight: state.browser.height,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AppLayout)
