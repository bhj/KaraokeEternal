import PropTypes from 'prop-types'
import React from 'react'
import LocalMedia from './LocalMedia'
import OnlineMedia from './OnlineMedia'
import './Prefs.css'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
  }

  render () {
    const { prefs } = this.props

    // @todo: bail if prefs haven't loaded yet

    return (
      <div>
        <h1 styleName='title'>Preferences</h1>

        <LocalMedia />

        <OnlineMedia />
      </div>
    )
  }
}
