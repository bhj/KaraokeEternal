import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { SkyLightStateless } from 'react-skylight'
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
      <SkyLightStateless
        isVisible
        onCloseClicked={this.props.closeSongInfo}
        onOverlayClicked={this.props.closeSongInfo}
        title={'Song Details'}
        dialogStyles={{
          width: '90%',
          height: '90%',
          top: '5%',
          left: '5%',
          margin: 0,
          overflow: 'auto',
        }}
      >
        <h3>Media ({media.result.length})</h3>
        {mediaDetails}
        <button onClick={this.props.closeSongInfo}>Done</button>
      </SkyLightStateless>
    )
  }
}
