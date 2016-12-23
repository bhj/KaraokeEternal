import { connect } from 'react-redux'
import { loginUser, createUser, updateUser, changeView } from '../modules/account'
import AccountForm from '../components/AccountForm'

const mapActionCreators = {
  loginUser,
  createUser,
  updateUser,
  changeView
}

const mapStateToProps = (state) => {
  return {
    user: state.account.user,
    rooms: state.account.rooms,
    viewMode: state.account.viewMode
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountForm)
