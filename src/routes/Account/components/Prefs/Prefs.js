import PropTypes from 'prop-types'
import React from 'react'
import LocalMedia from './LocalMedia'
import OnlineMedia from './OnlineMedia'
import './Prefs.css'

export default class Prefs extends React.Component {
  static propTypes = {
    fetchPrefs: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchPrefs()
  }

  render () {
    return (
      <div styleName='container'>
        <h1 styleName='title'>Preferences</h1>
        <div styleName='content'>
          <h2 styleName='subheading'>Media folders</h2>
          <LocalMedia />

          <h2 styleName='subheading'>Online media</h2>
          <OnlineMedia />
        </div>
      </div>
    )
  }
}
