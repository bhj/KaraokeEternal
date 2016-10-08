import React from 'react'
import classes from './Header.css'

const Header = (props) => (
  <div className={classes.container}>
    <h1 className={classes.title}>{props.title}</h1>
    {!props.isPlaying &&
      <div className={classes.button} onClick={props.requestPlay}>
        <i className={'material-icons '+classes.button}>play_arrow</i>
      </div>
    }
    {props.isPlaying &&
      <div className={classes.button} onClick={props.requestPause}>
        <i className={'material-icons '+classes.button}>pause</i>
      </div>
    }
  </div>
)

export default Header
