import { connect } from 'react-redux'
import SongInfo from './SongInfo'
import { closeSongInfo } from 'store/modules/ui'

const mapActionCreators = {
  closeSongInfo,
}

const mapStateToProps = (state) => ({
  media: state.ui.songInfoMedia,
})

export default connect(mapStateToProps, mapActionCreators)(SongInfo)
