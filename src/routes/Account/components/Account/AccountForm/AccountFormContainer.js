import { connect } from 'react-redux'
import AccountForm from './AccountForm'
import { logoutUser, createUser, updateUser } from 'store/modules/user'

const mapActionCreators = {
  logoutUser,
  createUser,
  updateUser,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    isLoggedIn: state.user.userId !== null,
    isFirstRun: state.prefs.isFirstRun === true,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountForm)
