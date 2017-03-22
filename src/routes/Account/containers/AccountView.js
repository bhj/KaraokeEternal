import { connect } from 'react-redux'
import { loginUser, logoutUser, createUser, updateUser } from 'store/modules/user'
import AccountView from '../components/AccountView'

const mapActionCreators = {
  loginUser,
  logoutUser,
  createUser,
  updateUser,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountView)
