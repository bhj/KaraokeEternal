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
  }

  render () {
    const { media, songId } = this.props

    if (!media.result.length) {
      return (<p>Loading...</p>)
    }

    const mediaDetails = media.result.map((mediaId) => {
      const item = media.entities[mediaId]

      return (
        <div key={item.mediaId} styleName='media'>
          <strong>File:</strong> {item.file}<br />
          <strong>Duration:</strong> {formatDuration(item.duration)}<br />
          <strong>Preferred:</strong> {item.isPreferred === 1 ? 'Yes' : 'No'}
        </div>
      )
    })

    return (
      <>
        <p>
          <strong>Song ID: </strong>{songId}<br />
          <strong>Media Files: </strong>{media.result.length}
        </p>
          {mediaDetails}
        <button onClick={this.props.closeSongInfo}>Done</button>
      </>
    )
  }
}
