import { connect } from 'react-redux'
import SongInfo from './SongInfo'
import { closeSongInfo } from '../../modules/library'

const mapActionCreators = {
  closeSongInfo,
}

const mapStateToProps = (state) => ({
  media: state.library.songInfoMedia,
})

export default connect(mapStateToProps, mapActionCreators)(SongInfo)
