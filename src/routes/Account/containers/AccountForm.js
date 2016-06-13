import { connect } from 'react-redux'
import { loginUser, logoutUser, createUser, updateUser, changeView } from '../modules/account'
import AccountForm from '../components/AccountForm'

const mapActionCreators = {
  loginUser,
  logoutUser,
  createUser,
  updateUser,
  changeView
}

const mapStateToProps = (state) => ({
  user: state.account.user,
  rooms: state.account.rooms,
  errorMessage: state.account.errorMessage,
  viewMode: state.account.viewMode
})

export default connect(mapStateToProps, mapActionCreators)(AccountForm)
