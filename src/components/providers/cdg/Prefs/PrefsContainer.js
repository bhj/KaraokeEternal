import { connect } from 'react-redux'
import Prefs from './Prefs'
import { setPrefs } from 'store/reducers/ui'

const mapActionCreators = {
  setPrefs,
}

const mapStateToProps = (state) => {
  const prefs = state.ui.prefs

  if (prefs && prefs.provider && prefs.provider.cdg) {
    return {prefs: prefs.provider.cdg}
  }

  return {prefs: {}}
}

export default connect(mapStateToProps, mapActionCreators)(Prefs)
