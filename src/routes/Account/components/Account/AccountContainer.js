import { connect } from 'react-redux'
import Account from './Account'
import { updateUser, logoutUser } from 'store/modules/user'

const mapActionCreators = {
  updateUser,
  logoutUser,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Account)
