import React, { PropTypes } from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'

class PlayerView extends React.Component {
  static propTypes = {
    // actions
    play: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired,
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    getMediaError: PropTypes.func.isRequired,
    // store state
    queue: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
  }

  render () {
    if (!this.props.queue.result.length) return null

    const curItem = this.props.queue.entities[this.props.queue.result[0]]
    const Player = ProviderPlayers[curItem.provider]

    if (!Player) {
      // no player component for this provider (todo: better error)
      return null
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <Player
            width={width}
            height={height}
            item={curItem}
            isPlaying={this.props.isPlaying}
            getMedia={this.props.getMedia}
            getMediaSuccess={this.props.getMediaSuccess}
            getMediaError={this.props.getMediaError}
          />
        )}
      </AutoSizer>
    )
  }
}

export default PlayerView
