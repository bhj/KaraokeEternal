import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { SkyLightStateless } from 'react-skylight'
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
      const preferred = item.isPreferred === 1 ? 'Yes' : 'No'
      let source

      // @todo: providers should have a media info component
      if (item.provider === 'file') {
        source = item.providerData.basePath + item.providerData.relPath
      } else if (item.provider === 'youtube') {
        source = item.providerData.videoId
      }

      return (
        <div key={item.mediaId} styleName='media'>
          <strong styleName='capitalize'>{item.provider}</strong>: {source}
          <br />
          <strong>Duration</strong>: {item.duration}
          <br />
          <strong>Preferred</strong>: {preferred}
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
          width: '80%',
          left: '10%',
          marginLeft: '0',
          overflow: 'auto',
        }}
      >
        <h2>Media ({media.result.length})</h2>
        {mediaDetails}
        <button onClick={this.props.closeSongInfo}>Done</button>
      </SkyLightStateless>
    )
  }
}
