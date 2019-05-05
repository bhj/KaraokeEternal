import { connect } from 'react-redux'
import SongInfo from './SongInfo'
import { closeSongInfo, setPreferred } from 'store/modules/songInfo'

const mapActionCreators = {
  closeSongInfo,
  setPreferred,
}

const mapStateToProps = (state) => ({
  media: state.songInfo.media,
})

export default connect(mapStateToProps, mapActionCreators)(SongInfo)
