import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import Header from './Header'
import { clearErrorMessage } from 'store/reducers'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  return {
    errorMessage: state.errorMessage,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
