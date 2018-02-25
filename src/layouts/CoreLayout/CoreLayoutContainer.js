import CoreLayout from './CoreLayout'
import { connect } from 'react-redux'
import { clearErrorMessage } from 'store/modules/ui'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    errorMessage: state.ui.errorMessage,
    browserWidth: state.browser.width,
    browserHeight: state.browser.height,
    headerHeight: state.ui.headerHeight,
    footerHeight: state.ui.footerHeight,
  }
}

export default connect(mapStateToProps, mapActionCreators)(CoreLayout)
