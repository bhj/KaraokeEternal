import React, { PropTypes } from 'react'
import VirtualList from 'components/VirtualList'
import ArtistItem from '../ArtistItem'

class ArtistList extends React.Component {
  static propTypes = {
    result: PropTypes.array,
    entities: PropTypes.object,
    onArtistSelect: PropTypes.func.isRequired
  }

  render () {
    if (!this.props.result.length) return null

    return (
      <VirtualList
        rowHeight={65}
        rowCount={this.props.result.length}
        rowRenderer={this._rowRenderer.bind(this)}
      />
    )
  }

  _rowRenderer ({ index }) {
    let {id, name, count} = this.props.entities[this.props.result[index]]
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
