import AppLayout from './AppLayout'
import { connect } from 'react-redux'
import { clearErrorMessage } from 'store/reducers'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.account.user && state.account.user.isAdmin,
    errorMessage: state.errorMessage,
    width: state.browser.width,
    height: state.browser.height,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AppLayout)
