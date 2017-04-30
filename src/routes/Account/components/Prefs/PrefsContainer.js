import { connect } from 'react-redux'
import Prefs from './Prefs'
import { setPrefs, providerRefresh } from 'store/modules/prefs'

const mapActionCreators = {
  setPrefs,
  providerRefresh,
}

const mapStateToProps = (state) => ({
  prefs: state.prefs,
  isAdmin: state.user.isAdmin,
})

export default connect(mapStateToProps, mapActionCreators)(Prefs)
