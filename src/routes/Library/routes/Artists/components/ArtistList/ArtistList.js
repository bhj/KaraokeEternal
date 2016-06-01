import React, { PropTypes } from 'react'
import VirtualList from 'components/VirtualList'
import ArtistItem from '../ArtistItem'

class ArtistList extends React.Component {
  static propTypes = {
    artists: PropTypes.array,
    onArtistSelect: PropTypes.func.isRequired
  }

  render () {
    let artists = this.props.artists
    if (!artists) return null

    return (
      <VirtualList
        rowHeight={65}
        rowCount={artists.length}
        rowRenderer={this._rowRenderer.bind(this)}
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
}

export default ArtistList
