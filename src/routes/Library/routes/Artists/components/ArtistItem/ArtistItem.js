import React, { PropTypes} from 'react'
import classes from './ArtistItem.css'

export const ArtistItem = (props) => (
  <div onClick={props.onArtistSelect} className={classes.container}>
    <i className={'material-icons '+classes.icon}>
      {props.isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
    </i>
    <div className={classes.name}>{props.name}</div>
    <div className={classes.count}>{props.count}</div>
  </div>
)

ArtistItem.propTypes = {
  count: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onArtistSelect: React.PropTypes.func.isRequired
}

export default ArtistItem
