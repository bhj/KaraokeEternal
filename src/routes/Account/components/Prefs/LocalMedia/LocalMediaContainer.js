import { connect } from 'react-redux'
import LocalMedia from './LocalMedia'
import { setPrefs, requestScan } from 'store/modules/prefs'

const mapActionCreators = {
  setPrefs,
  requestScan,
}

const mapStateToProps = (state) => ({
  paths: state.prefs.app ? state.prefs.app.paths : [],
})

export default connect(mapStateToProps, mapActionCreators)(LocalMedia)
