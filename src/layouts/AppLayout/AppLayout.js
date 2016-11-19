import React from 'react'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import PlaybackCtrl from 'components/PlaybackCtrl'
import classes from './AppLayout.css'

const AppLayout = (props) => (
  <div className={classes.container}>

    <div className={classes.header}>
      <Header title={props.title}/>
    </div>

    <div className={classes.viewport}>
      {props.children}
    </div>

    <div className={classes.nav}>
      <Navigation/>
    </div>
  </div>
)

export default AppLayout
