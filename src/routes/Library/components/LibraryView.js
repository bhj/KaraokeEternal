import React, { PropTypes } from 'react'
import VirtualList from './VirtualList'
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
        items={artists}
        rowComponent={ArtistItem}
        rowHeight={65}
        onItemClick={this.handleClick.bind(this)}
      />
    )
  }

  handleClick(e){
    console.log(e)
  }
}

export default LibraryView
