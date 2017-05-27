import { connect } from 'react-redux'
import AccountView from './AccountView'
import { loginUser, logoutUser, createUser, updateUser } from 'store/modules/user'

const mapActionCreators = {
  loginUser,
  logoutUser,
  createUser,
  updateUser,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    isLoggedIn: state.user.userId !== null,
    isFirstRun: state.prefs.app && state.prefs.app.firstRun,
    rooms: state.room.rooms,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountView)
