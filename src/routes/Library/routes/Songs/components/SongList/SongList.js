import React, { PropTypes } from 'react'
import SwipeableItem from 'components/SwipeableItem'
// import ArtistItem from '../ArtistItem'

class SongList extends React.Component {
  static propTypes = {
    fetchSongs: PropTypes.func.isRequired,
    songs: PropTypes.object
  }

  render () {
    let songs = this.props.songs
    if (!songs) return null

    return (
      <h1>Songs!</h1>
    )
  }

  // handleArtistClick(id){
  //   let ref = this.lastRevealedRef
  //   if (ref && (ref.state.showLeftButtons || ref.state.showRightButtons)){
  //     // skip; swipe options are currently revealed
  //     return
  //   }
  //   console.log('select', id)
  // }
  //
  // handleOptionsClick(id, action){
  //   console.log(action, id)
  // }
  //
  // handleReveal(ref) {
  //   if (this.lastRevealedRef){
  //     this.lastRevealedRef.close()
  //   }
  //
  //   this.lastRevealedRef = ref
  // }
}

export default SongList
