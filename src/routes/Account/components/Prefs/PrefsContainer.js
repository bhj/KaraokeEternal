import { connect } from 'react-redux'
import Prefs from './Prefs'
import { fetchPrefs } from 'store/modules/prefs'

const mapActionCreators = {
  fetchPrefs,
}

const mapStateToProps = (state) => ({
})

export default connect(mapStateToProps, mapActionCreators)(Prefs)
