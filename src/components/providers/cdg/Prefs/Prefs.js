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
    this.props.setPrefs('provider.cdg', prefs)
  }

  handleRefresh = () => {
    this.props.providerRefresh('cdg')
  }

  render () {
    const { prefs } = this.props
    if (!prefs) return null

    let paths = prefs.paths || []

    paths = paths.map(path => (
      <p key={path}>{path}</p>
    ))

    return (
      <div>
        <label>
          <input type='checkbox' checked={prefs.enabled} onChange={this.setEnabled} />
          <strong> CD+Graphics (.cdg + audio)</strong>
        </label>
        <button onClick={this.handleRefresh}>Refresh</button>
        {paths}
      </div>
    )
  }
}
