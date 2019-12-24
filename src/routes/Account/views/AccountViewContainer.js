import { connect } from 'react-redux'
import AccountView from './AccountView'

const mapActionCreators = {
}

const mapStateToProps = (state) => {
  return {
    isLoggedIn: state.user.userId !== null,
    isAdmin: state.user.isAdmin,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountView)
