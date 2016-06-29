import React, { PropTypes} from 'react'
import classes from './ArtistItem.css'

class ArtistItem extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isChildQueued: PropTypes.bool.isRequired,
    onArtistSelect: PropTypes.func.isRequired
  }

  render () {
    let { name, count, onArtistSelect, isChildQueued} = this.props

    return (
      <div>
        <div onClick={onArtistSelect} className={classes.container + (isChildQueued ? ' ' + classes.hasQueued : '')}>
          <div className={classes.countIcon}>{count}</div>
          <div className={classes.name}>{name}</div>
        </div>
        {this.props.children}
      </div>
    )
  }
}

export default ArtistItem
