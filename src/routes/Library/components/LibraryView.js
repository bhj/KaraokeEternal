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
        onOptionsClick={this.handleOptionsClick.bind(this, id)}
        onOptionsReveal={this.handleReveal.bind(this)}
        onOptionsClose={this.handleClose.bind(this)}
      >
        <ArtistItem
          name={name}
          count={count}
          onSelectArtist={this.handleArtistClick.bind(this, id)}
        />
      </SwipeableItem>
    )
  }

  handleArtistClick(id){
    // only if swipe options are not currently revealed
    if (!this.lastRevealedRef){
      console.log('select', id)
    }
  }

  handleOptionsClick(id, action){
    console.log(action, id)
  }

  handleClose(ref){
    this.lastRevealedRef = null
  }

  handleReveal(ref) {
    if (this.lastRevealedRef){
      this.lastRevealedRef.close()
    }

    this.lastRevealedRef = ref
  }
}

export default LibraryView
