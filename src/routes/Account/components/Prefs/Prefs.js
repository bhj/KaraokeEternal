import React from 'react'
import PathPrefs from './PathPrefs'
import PlayerPrefs from './PlayerPrefs'
import './Prefs.css'

export default class Prefs extends React.Component {
  render () {
    return (
      <div styleName='container'>
        <h1 styleName='title'>Preferences</h1>
        <div styleName='content'>
          <PathPrefs />
          <PlayerPrefs />
        </div>
      </div>
    )
  }
}
