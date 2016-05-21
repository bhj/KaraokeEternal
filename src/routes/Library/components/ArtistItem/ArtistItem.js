import React from 'react'

export const ArtistItem = (props) => (
  <div onClick={props.onSelectArtist}>
    {props.name} ({props.count})
  </div>
)

ArtistItem.propTypes = {
  count: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  onSelectArtist: React.PropTypes.func.isRequired
}

export default ArtistItem
