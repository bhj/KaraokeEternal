import { connect } from 'react-redux'
import Login from './Login'
import { loginUser, createUser } from 'store/modules/user'

const mapActionCreators = {
  loginUser,
  createUser,
}

const mapStateToProps = (state) => {
  return {
    isFirstRun: state.prefs.isFirstRun === true,
    isLoggedIn: state.user.userId !== null,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Login)
