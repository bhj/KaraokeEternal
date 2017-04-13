import PropTypes from 'prop-types'
import React from 'react'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    providerRefresh: PropTypes.func.isRequired,
  }

  setEnabled = (e) => {
    let prefs = Object.assign({}, this.props.prefs)
    prefs.enabled = e.target.checked
    this.props.setPrefs('provider.youtube', prefs)
  }

  handleRefresh = () => {
    this.props.providerRefresh('youtube')
  }

  render () {
    const { prefs } = this.props
    if (!prefs) return null

    const enabled = prefs.enabled === true
    let paths = prefs.paths || []

    paths = paths.map(path => (
      <p key={path}>{path}</p>
    ))

    return (
      <div>
        <label>
          <input type='checkbox' checked={enabled} onChange={this.setEnabled} />
          <strong> YouTube Channels</strong>
        </label>
        <button onClick={this.handleRefresh}>Refresh</button>
        {paths}
      </div>
    )
  }
}
