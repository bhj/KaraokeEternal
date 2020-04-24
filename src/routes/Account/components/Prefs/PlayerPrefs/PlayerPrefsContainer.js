import { connect } from 'react-redux'
import PlayerPrefs from './PlayerPrefs'
import { setPref } from 'store/modules/prefs'

const mapActionCreators = {
  setPref,
}

const mapStateToProps = (state) => ({
  isReplayGainEnabled: state.prefs.isReplayGainEnabled,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerPrefs)
