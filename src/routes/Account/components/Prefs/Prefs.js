import PropTypes from 'prop-types'
import React from 'react'
import PathPrefs from './PathPrefs'
import './Prefs.css'

export default class Prefs extends React.Component {
  static propTypes = {
    // actions
    fetchPrefs: PropTypes.func.isRequired,
  }

  // componentDidMount () {
  //   this.props.fetchPrefs()
  // }

  render () {
    return (
      <div styleName='container'>
        <h1 styleName='title'>Preferences</h1>
        <div styleName='content'>
          <PathPrefs />
        </div>
      </div>
    )
  }
}
