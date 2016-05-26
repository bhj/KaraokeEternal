import React, { PropTypes } from 'react'
import VirtualList from 'components/VirtualList'
import SwipeableItem from 'components/SwipeableItem'
import ArtistItem from '../ArtistItem'

class ArtistList extends React.Component {
  static propTypes = {
    fetchArtists: PropTypes.func.isRequired,
    artists: PropTypes.object.isRequired
  }

  componentWillMount() {
    this.props.fetchArtists()
  }

  componentWillUnmount() {
    // get scrolltop
    //
  }

  render () {
    // @todo - fix reducer structure
    let artists = this.props.artists.artists
    if (!artists) return null

    return (
      <VirtualList
        rowHeight={65}
        rowCount={artists.length}
        rowRenderer={(index) => this._rowRenderer(index)}
      />
    )
  }

  _rowRenderer ({ index }) {
    // @todo - fix reducer structure
    let {id, name, count} = this.props.artists.artists[index]
    return (
      <SwipeableItem
        onOptionsClick={this.handleOptionsClick.bind(this, id)}
        onOptionsReveal={this.handleReveal.bind(this)}
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
    let ref = this.lastRevealedRef
    if (ref && (ref.state.showLeftButtons || ref.state.showRightButtons)){
      // skip; swipe options are currently revealed
      return
    }
    console.log('select', id)
  }

  handleOptionsClick(id, action){
    console.log(action, id)
  }

  handleReveal(ref) {
    if (this.lastRevealedRef){
      this.lastRevealedRef.close()
    }

    this.lastRevealedRef = ref
  }
}

export default ArtistList
