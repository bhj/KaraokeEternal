import React from 'react'
import { AutoSizer } from 'react-virtualized'
import ProviderPlayers from './provider'

class PlayerView extends React.Component {
  static propTypes = {
    // actions
    fetchQueue: React.PropTypes.func.isRequired,
    play: React.PropTypes.func.isRequired,
    pause: React.PropTypes.func.isRequired,
    changeQueueItem: React.PropTypes.func.isRequired,
    getMedia: React.PropTypes.func.isRequired,
    getMediaSuccess: React.PropTypes.func.isRequired,
    getMediaError: React.PropTypes.func.isRequired,
    // store state
    queue: React.PropTypes.object.isRequired,
    isPlaying: React.PropTypes.bool.isRequired,
    isFetching: React.PropTypes.bool.isRequired,
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

  // shouldComponentUpdate(nextProps, nextState) {
  //   if (this.props.queue.result.length && nextProps.queue.result.length) {
  //     // did the first item in the queue change?
  //     return this.props.queue.entities[this.props.queue.result[0]] !== nextProps.queue.entities[nextProps.queue.result[0]]
  //   }
  //
  //   if (!this.props.queue.result.length && !nextProps.queue.result.length) {
  //     // still nothing in queue; don't bother
  //     return false
  //   }
  //
  //   return true
  // }

  componentDidUpdate (prevProps) {
    // dispatch action with the new queue item
    this.props.changeQueueItem(this.props.queue.entities[this.props.queue.result[0]])
  }

  componentDidMount () {
    this.props.fetchQueue() // debug
    // this.timeout = setInterval(this.props.fetchQueue, 2000)
  }

  componentWillUnmount () {
    clearTimeout(this.timeout);
  }
}

export default PlayerView
