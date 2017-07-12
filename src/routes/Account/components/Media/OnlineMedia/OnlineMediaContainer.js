import { connect } from 'react-redux'
import OnlineMedia from './OnlineMedia'
import { setPrefs } from 'store/modules/prefs'
import { requestScan } from 'routes/Library/modules/library'

const mapActionCreators = {
  setPrefs,
  requestScan,
}

const mapStateToProps = (state) => ({
  prefs: state.prefs,
})

export default connect(mapStateToProps, mapActionCreators)(OnlineMedia)
