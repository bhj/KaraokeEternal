import { connect } from 'react-redux'
import AccountView from './AccountView'

const mapActionCreators = {
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
  }
}

export default connect(mapStateToProps, mapActionCreators)(AccountView)
