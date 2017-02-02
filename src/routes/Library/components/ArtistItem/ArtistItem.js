import React, { PropTypes } from 'react'
import classes from './ArtistItem.css'

const ArtistItem = (props) => {
  return (
    <div style={props.style}>
      <div onClick={props.onArtistSelect} className={classes.container + (props.isChildQueued ? ' ' + classes.hasQueued : '')}>
        <div className={classes.countIcon}>{props.count}</div>
        <div className={classes.name}>{props.name}</div>
      </div>
      {props.children}
    </div>
  )
}

ArtistItem.propTypes = {
  count: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isChildQueued: PropTypes.bool.isRequired,
  onArtistSelect: PropTypes.func.isRequired,
  style: PropTypes.object,
}

export default ArtistItem
