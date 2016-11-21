import React from 'react'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import PlaybackCtrl from 'components/PlaybackCtrl'
import { SkyLightStateless } from 'react-skylight'
import classes from './AppLayout.css'

const AppLayout = (props) => {
  const style = {
    paddingTop: props.isAdmin ? 118 : 54,
    paddingBottom: 50
  }

  return (
    <div>
      <div className={classes.header}>
        <Header title={props.title}/>
        {props.isAdmin === 1 &&
          <PlaybackCtrl/>
        }
      </div>

      <div className={classes.viewport} style={{width: props.width, height: props.height}}>
        {props.children(style)}
      </div>

      <div className={classes.nav}>
        <Navigation/>
      </div>

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
}

export default AppLayout
