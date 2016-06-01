import React, { PropTypes } from 'react'
import VirtualList from 'components/VirtualList'
import ArtistItem from '../ArtistItem'

class ArtistList extends React.Component {
  static propTypes = {
    // fetchArtists: PropTypes.func.isRequired,
    artists: PropTypes.array,
    onArtistSelect: PropTypes.func.isRequired
  }

  componentWillMount() {
    console.log('mounted!')
  }

  componentWillUnmount() {
    console.log('UNmounted!')
  }

  render () {
    let artists = this.props.artists
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
    let {id, name, count} = this.props.artists[index]
    return (
      <ArtistItem
        name={name}
        count={count}
        onArtistSelect={this.props.onArtistSelect.bind(this, id)}
      />
    )
  }

  // handleArtistClick(id){
  //   // @todo easiest way to get current URL dynamically?
  //   this.props.dispatch(push('/library/artists/'+id))
  // }

  // handleOptionsClick(id, action){
  //   console.log(action, id)
  // }
}

export default ArtistList
