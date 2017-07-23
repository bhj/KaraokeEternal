import { connect } from 'react-redux'
import Media from './Media'
import { fetchPaths } from 'store/modules/paths'
import { fetchPrefs } from 'store/modules/prefs'

const mapActionCreators = {
  fetchPaths,
  fetchPrefs,
}

const mapStateToProps = (state) => ({
})

export default connect(mapStateToProps, mapActionCreators)(Media)
