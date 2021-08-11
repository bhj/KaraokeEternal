import PropTypes from 'prop-types'
import React from 'react'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import styles from './YouTubeItem.css'

let ignoreMouseup = false

export default class YouTubeItem extends React.Component {
  static YOUTUBE_ITEM_HEIGHT = 70

  static propTypes = {
    video: PropTypes.object.isRequired,
    style: PropTypes.object,
    onVideoTap: PropTypes.func,
  }

  state = {
  }

  render () {
    const { props, state } = this

    return (
      <div
        onClick={this.handleClick}
        style={ props.style }
        className={props.video.queued ? styles.containerQueued : styles.container}
      >
        <div className={styles.thumbnailContainer}>
          <img src={props.video.thumbnail} />
          <div className={styles.mixtypeicon}>
            {props.video.karaoke && <Icon icon='MICROPHONE' size={35}/>}
            {!props.video.karaoke && <Icon icon='HOURGLASS' size={35}/>}
          </div>
          <div className={styles.duration}>
            {props.video.duration}
          </div>
        </div>
        <div className={styles.primary}>
          <div className={styles.title}>
            {props.video.title}
            {props.video.karaoke && <div className={styles.mixtype}><Icon icon='MICROPHONE' size={12}/> Pre-made karaoke mix</div>}
            {!props.video.karaoke && <div className={styles.mixtype}><Icon icon='HOURGLASS' size={12} className={`${styles.spin}`} /> Ready in a few minutes</div>}
            {props.video.channel && <div className={styles.channel}>{props.video.channel}</div>}
          </div>
        </div>
      </div>
    )
  }

  handleClick = () => {
    ignoreMouseup ? ignoreMouseup = false : this.props.onVideoTap(this.props.video)
  }
}
