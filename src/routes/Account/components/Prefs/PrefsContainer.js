import { connect } from 'react-redux'
import Prefs from './Prefs'
import { setPrefs, requestScan } from 'store/modules/prefs'

const mapActionCreators = {
  setPrefs,
  requestScan,
}

const mapStateToProps = (state) => ({
  prefs: state.prefs,
  isAdmin: state.user.isAdmin,
})

export default connect(mapStateToProps, mapActionCreators)(Prefs)
