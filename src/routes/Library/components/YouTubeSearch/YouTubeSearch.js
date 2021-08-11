import PropTypes from 'prop-types'
import React from 'react'
import PaddedList from 'components/PaddedList'
import styles from './YouTubeSearch.css'
import ColorCycle from '../../../Player/components/PlayerTextOverlay/ColorCycle'
import HttpApi from 'lib/HttpApi'
import { _ERROR, USERS_REQUEST } from '../../../../../shared/actionTypes'
import { fetchUsers, receiveUsers } from '../../../Account/modules/users'
import YouTubeItem from '../YouTubeItem'
import YouTubeIdentify from '../YouTubeIdentify'

const api = new HttpApi('')

class YouTubeSearch extends React.Component {
  static propTypes = {
    filterKeywords: PropTypes.array.isRequired,
    ui: PropTypes.object.isRequired,
    onDone: PropTypes.func.isRequired,
  }

  state = {
    loading: true,
    identifying: null,
    error: false,
    videos: [],
  }

  componentDidMount () {
    this.performSearch()
  }

  performSearch = () => {
    api('POST', 'youtubesearch', {
      body: this.props.filterKeywords.join(' ')
    })
      .then((videos) => {
        this.setState({ videos:videos, loading:false })
      })
      .catch(() => {
        this.setState({ error:true, loading:false })
      })
  }

  render () {
    if (this.state.loading) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <ColorCycle text='SEARCHING YOUTUBE' className={styles.backdrop}/>
        </div>
      )
    } else if (this.state.error || !this.state.videos) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div>We had a problem searching YouTube :(</div>
          <div style={{ paddingTop:30 }}>
            <button onClick={this.retry} className={`${styles.btn} primary`}>Try Again</button>
          </div>
        </div>
      )
    } else if (this.state.videos.length === 0) {
      return (
        <div className={styles.container} style={{
          paddingTop:this.props.ui.headerHeight,
          paddingBottom:this.props.ui.footerHeight,
          width:this.props.ui.innerWidth,
          height:this.props.ui.innerHeight,
        }}>
          <div>We found nothin'</div>
        </div>
      )
    } else if (this.state.identifying !== null) {
      return (
        <YouTubeIdentify
          ui={this.props.ui}
          video={this.state.identifying}
          query={this.props.filterKeywords.join(' ')}
          onQueued={this.videoQueued}
          onCancel={this.identifyCancelled}
        />
      )
    }

    return (
      <PaddedList
        numRows={this.state.videos.length}
        rowHeight={() => { return YouTubeItem.YOUTUBE_ITEM_HEIGHT }}
        rowRenderer={this.rowRenderer}
        paddingTop={this.props.ui.headerHeight}
        paddingRight={4}
        paddingBottom={this.props.ui.footerHeight}
        width={this.props.ui.innerWidth}
        height={this.props.ui.innerHeight}
      />
    )
  }

  rowRenderer = ({ index, style }) => {
    const { videos } = this.state

    // song results
    return (
      <YouTubeItem
        key={videos[index].id.videoId}
        video={videos[index]}
        style={style}
        onVideoTap={this.identifyYoutubeVideo }
      />
    )
  }

  identifyCancelled = () => {
    this.setState({ identifying:null })
  }

  videoQueued = () => {
    this.props.onDone()
  }

  identifyYoutubeVideo = (video) => {
    this.setState({ error:false, loading:false, identifying:video })
  }

  retry = () => {
    this.setState({ error:false, loading:true, identifying:null, videos:[] })
    this.performSearch()
  }
}

export default YouTubeSearch
