import { connect } from 'react-redux'
import LocalMedia from './LocalMedia'
import { setPrefs } from 'store/modules/prefs'
import { requestUpdate } from 'routes/Library/modules/library'

const mapActionCreators = {
  setPrefs,
  requestUpdate,
}

const mapStateToProps = (state) => ({
  paths: state.prefs.app ? state.prefs.app.paths : [],
})

export default connect(mapStateToProps, mapActionCreators)(LocalMedia)
