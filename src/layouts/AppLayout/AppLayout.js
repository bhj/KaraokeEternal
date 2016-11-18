import React from 'react'
import Header from 'components/Header'
import Navigation from 'components/Navigation'
import PlaybackCtrl from 'components/PlaybackCtrl'
import classes from './AppLayout.css'

const AppLayout = (props) => (
  <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
    <Header title={props.title}/>

    <PlaybackCtrl />

    <div style={{flex: '1', overflow: 'auto'}}>
      {props.children}
    </div>

    <Navigation/>
  </div>
)

AppLayout.propTypes = {
  // children: React.PropTypes.element,
}

export default AppLayout
