import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import YouTubeIdentify from './YouTubeIdentify'
import { queueYoutubeVideo } from 'routes/Queue/modules/queue'

const mapActionCreators = {
  queueYoutubeVideo,
}

export default connect(null, mapActionCreators)(YouTubeIdentify)
