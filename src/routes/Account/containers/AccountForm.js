import { connect } from 'react-redux'
import { loginUser, createUser, updateUser } from 'store/modules/user'
import AccountForm from '../components/AccountForm'

const mapActionCreators = {
  loginUser,
  createUser,
  updateUser,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
    rooms: state.user.rooms,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountForm)
