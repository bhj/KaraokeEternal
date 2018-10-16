import { connect } from 'react-redux'
import Login from './Login'
import { login, createAccount } from 'store/modules/user'

const mapActionCreators = {
  login,
  createAccount,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    isFirstRun: state.prefs.isFirstRun === true,
    isLoggedIn: state.user.userId !== null,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Login)
