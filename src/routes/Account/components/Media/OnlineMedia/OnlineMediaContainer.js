import { connect } from 'react-redux'
import OnlineMedia from './OnlineMedia'
import { setPrefs, requestScan } from 'store/modules/prefs'

const mapActionCreators = {
  setPrefs,
  requestScan,
}

const mapStateToProps = (state) => ({
  prefs: state.prefs,
})

export default connect(mapStateToProps, mapActionCreators)(OnlineMedia)
