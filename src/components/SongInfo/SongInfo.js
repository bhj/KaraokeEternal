import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { formatSeconds } from 'lib/dateTime'
import './SongInfo.css'

export default class SongInfo extends Component {
  static propTypes = {
    media: PropTypes.object.isRequired,
    // actions
    closeSongInfo: PropTypes.func.isRequired,
  }

  render () {
    const { media } = this.props

    if (!media.result.length) {
      return (<p>Loading...</p>)
    }

    const mediaDetails = media.result.map((mediaId) => {
      const item = media.entities[mediaId]

      return (
        <div key={item.mediaId} styleName='media'>
          <strong>File:</strong> {item.file}
          <br />
          <strong>Duration:</strong> {formatSeconds(item.duration)}
          <br />
          <strong>Preferred:</strong> {item.isPreferred === 1 ? 'Yes' : 'No'}
        </div>
      )
    })

    return (
      <>
        <h3>Media ({media.result.length})</h3>
        {mediaDetails}
        <button onClick={this.props.closeSongInfo}>Done</button>
      </>
    )
  }
}
