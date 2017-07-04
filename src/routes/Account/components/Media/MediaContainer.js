import { connect } from 'react-redux'
import Media from './Media'
import { fetchPrefs } from 'store/modules/prefs'

const mapActionCreators = {
  fetchPrefs,
}

const mapStateToProps = (state) => ({
})

export default connect(mapStateToProps, mapActionCreators)(Media)
