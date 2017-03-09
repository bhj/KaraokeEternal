import { connect } from 'react-redux'
import { loginUser, createUser, updateUser, changeView } from 'store/modules/user'
import AccountForm from '../components/AccountForm'

const mapActionCreators = {
  loginUser,
  createUser,
  updateUser,
  changeView
}

const mapStateToProps = (state) => {
  return {
    user: state.user.user,
    rooms: state.user.rooms,
    viewMode: state.user.viewMode
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountForm)
