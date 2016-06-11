import React, { PropTypes} from 'react'
import classes from './ArtistItem.css'

export const ArtistItem = (props) => (
  <div>
    <div onClick={props.onArtistSelect} className={classes.container}>
      <div className={classes.countIcon}>{props.count}</div>
      <div className={classes.name}>{props.name}</div>
    </div>
    {props.children}
  </div>
)

ArtistItem.propTypes = {
  count: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistSelect: React.PropTypes.func.isRequired
}

export default ArtistItem
