import { connect } from 'react-redux'
import Prefs from './Prefs'
import { setPrefs, providerRefresh } from 'store/modules/user'

const mapActionCreators = {
  setPrefs,
  providerRefresh,
}

const mapStateToProps = (state) => {
  const { prefs } = state.user

  if (prefs && prefs.provider && prefs.provider.youtube) {
    return { prefs: prefs.provider.youtube }
  }

  return { prefs: {} }
}

export default connect(mapStateToProps, mapActionCreators)(Prefs)
