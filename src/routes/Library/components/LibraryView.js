import React, { PropTypes } from 'react'
import VirtualList from 'components/VirtualList'
import SwipeableItem from 'components/SwipeableItem'
import ArtistItem from './ArtistItem'

class LibraryView extends React.Component {
  static propTypes = {
    fetchArtists: PropTypes.func.isRequired,
    library: PropTypes.object.isRequired
  }

  componentWillMount() {
    if (! this.props.library.artists) {
      this.props.fetchArtists()
    }
  }

  render () {
    let artists = this.props.library.artists
    if (!artists) return null

    return (
      <VirtualList
        rowHeight={65}
        rowCount={this.props.library.artists.length}
        rowRenderer={(index) => this._rowRenderer(index)}
      />
    )
  }

  _rowRenderer ({ index }) {
    let {id, name, count} = this.props.library.artists[index]
    return (
      <SwipeableItem
        onItemClick={this.handleClick.bind(this, id)}
        onSwipeReveal={this.handleSwipeReveal.bind(this)}
      >
        <ArtistItem
          name={name}
          count={count}
          onSelectArtist={this.handleClick.bind(this, id, 'select')}
        />
      </SwipeableItem>
    )
  }

  handleClick(id, action){
    console.log(action, id)
  }

  handleSwipeReveal(ref) {
    // close previous swipeable when another is revealed
    if (this.lastOpenedRef){
      this.lastOpenedRef.close()
    }

    this.lastOpenedRef = ref
  }
}

export default LibraryView
