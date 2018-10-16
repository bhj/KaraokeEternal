import { connect } from 'react-redux'
import Account from './Account'
import { fetchAccount, updateAccount, logout } from 'store/modules/user'

const mapActionCreators = {
  fetchAccount,
  updateAccount,
  logout,
}

const mapStateToProps = (state) => {
  return {
    user: state.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Account)
