import React from 'react'
import classes from './SongItem.css'

export const SongItem = (props) => (
  <div onClick={props.onSelectSong} className={classes.container}>
    <div className={classes.star}>
      <i className='material-icons md-48 md-dark md-inactive'>
        {props.isStarred ? 'star' : 'star_border'}
      </i>
    </div>

    <div className={classes.title}>{props.title} ({props.provider})</div>

    <div className={classes.stats}>
      <i className='material-icons md-18 md-dark md-inactive'>play_arrow</i>
      {props.plays}

      <i className='material-icons md-18 md-dark md-inactive'>star</i>
      0
    </div>
  </div>
)

SongItem.propTypes = {
  plays: React.PropTypes.number.isRequired,
  title: React.PropTypes.string.isRequired,
  onSelectSong: React.PropTypes.func.isRequired
}

export default SongItem
