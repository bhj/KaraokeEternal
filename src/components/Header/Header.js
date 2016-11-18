import React from 'react'
import classes from './Header.css'
import { SkyLightStateless } from 'react-skylight'

const Header = (props) => (
  <div className={classes.container}>
    <h1 className={classes.title}>{props.title}</h1>

    <SkyLightStateless
      isVisible={props.errorMessage !== null}
      onCloseClicked={props.clearErrorMessage}
      onOverlayClicked={props.clearErrorMessage}
      title="Oops"
      dialogStyles={{
        width: '80%',
        height: 'auto',
        left: '10%',
        marginLeft: '0'}}
    >
      {props.errorMessage}
      <br/><br/><br/>
      <button className="button wide raised" onClick={props.clearErrorMessage}>Dismiss</button>
    </SkyLightStateless>
  </div>
)

export default Header
