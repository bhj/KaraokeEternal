import React from 'react'
import classes from './ArtistItem.css'

export const ArtistItem = (props) => (
  <div onClick={props.onArtistSelect} className={classes.container}>
    <div className={classes.count}>
      {props.count}
    </div>
    <div className={classes.name}>{props.name}</div>
  </div>
)

ArtistItem.propTypes = {
  count: React.PropTypes.number.isRequired,
  name: React.PropTypes.string.isRequired,
  onArtistSelect: React.PropTypes.func.isRequired
}

export default ArtistItem
