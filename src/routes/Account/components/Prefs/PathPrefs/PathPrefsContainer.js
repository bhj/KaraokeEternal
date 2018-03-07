import { connect } from 'react-redux'
import PathPrefs from './PathPrefs'
import { receivePrefs, requestScan } from 'store/modules/prefs'

const mapActionCreators = {
  receivePrefs,
  requestScan,
}

const mapStateToProps = (state) => ({
  paths: state.prefs.paths,
})

export default connect(mapStateToProps, mapActionCreators)(PathPrefs)
