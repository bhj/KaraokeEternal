import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { formatDuration } from 'lib/dateTime'
import './SongInfo.css'

export default class SongInfo extends Component {
  static propTypes = {
    songId: PropTypes.number,
    media: PropTypes.object.isRequired,
    // actions
    closeSongInfo: PropTypes.func.isRequired,
    setPreferred: PropTypes.func.isRequired,
  }

  render () {
    const { media, songId } = this.props

    if (!media.result.length) {
      return (<p>Loading...</p>)
    }

    const mediaDetails = media.result.map((mediaId) => {
      const item = media.entities[mediaId]
      const isPreferred = !!item.isPreferred

      return (
        <div key={item.mediaId} styleName='media'>
          {item.path + (item.path.indexOf('/') === 0 ? '/' : '\\') + item.relPath}<br />
          <span styleName='label'>Duration: </span>{formatDuration(item.duration)}<br />
          <span styleName='label'>Media ID: </span>{mediaId}<br />
          <span styleName='label'>Preferred: </span>
          {isPreferred &&
            <span><strong>Yes</strong>&nbsp;
              <a onClick={() => this.handleRemovePrefer(mediaId)}>(Unset)</a>
            </span>
          }
          {!isPreferred &&
            <span>No&nbsp;
              <a onClick={() => this.handlePrefer(mediaId)}>(Set)</a>
            </span>
          }
        </div>
      )
    })

    return (
      <>
        <p>
          <span styleName='label'>Song ID: </span>{songId}<br />
          <span styleName='label'>Media Files: </span>{media.result.length}
        </p>
        {mediaDetails}
        <button onClick={this.props.closeSongInfo}>Done</button>
      </>
    )
  }

  handlePrefer = mediaId => {
    this.props.setPreferred(this.props.songId, mediaId, true)
  }

  handleRemovePrefer = mediaId => {
    this.props.setPreferred(this.props.songId, mediaId, false)
  }
}
