import React from 'react'

export const ArtistItem = (props) => (
  <div onClick={props.onArtistSelect}>
    {props.name} ({props.count})
  </div>
)

ArtistItem.propTypes = {
  count: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  onArtistSelect: React.PropTypes.func.isRequired
}

export default ArtistItem
