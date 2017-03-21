import AppLayout from './AppLayout'
import { connect } from 'react-redux'
import { clearErrorMessage } from 'store/modules/ui'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    errorMessage: state.ui.errorMessage,
    viewportWidth: state.viewport.width,
    viewportHeight: state.viewport.height,
    headerHeight: state.ui.headerHeight,
    footerHeight: state.ui.footerHeight,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AppLayout)
