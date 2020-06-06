import { connect } from 'react-redux'
import SongInfo from './SongInfo'
import { closeSongInfo, setPreferred } from 'store/modules/songInfo'

const mapActionCreators = {
  closeSongInfo,
  setPreferred,
}

const mapStateToProps = (state) => ({
  isLoading: state.songInfo.isLoading,
  isVisible: state.songInfo.isVisible,
  media: state.songInfo.media,
  songId: state.songInfo.songId,
})

export default connect(mapStateToProps, mapActionCreators)(SongInfo)
