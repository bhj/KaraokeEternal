import PropTypes from 'prop-types'
import React from 'react'
import Buttons from 'components/Buttons'
import Icon from 'components/Icon'
import ToggleAnimation from 'components/ToggleAnimation'
import styles from './YouTubeSongItem.css'

let ignoreMouseup = false

export default class YouTubeSongItem extends React.Component {
  static ITEM_HEIGHT = 70

  static propTypes = {
    song: PropTypes.object.isRequired,
    style: PropTypes.object,
    onSongTap: PropTypes.func,
  }

  state = {
  }

  render () {
    const { props, state } = this

    return (
      <div
        onClick={this.handleClick}
        style={ props.style }
        className={styles.container}
      >
        <div className={styles.thumbnailContainer}>
          {props.song.thumbnail && <img src={props.song.thumbnail} />}
        </div>
        <div className={styles.primary}>
          <div className={styles.title}>
            {props.song.title}
            {props.song.artist && <div className={styles.artist}>{props.song.artist.name}</div>}
          </div>
        </div>
      </div>
    )
  }

  handleClick = () => {
    ignoreMouseup ? ignoreMouseup = false : this.props.onSongTap(this.props.song)
  }
}
