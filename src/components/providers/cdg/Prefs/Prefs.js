import React from 'react'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: React.PropTypes.object.isRequired,
    setPrefs: React.PropTypes.func.isRequired,
    providerRefresh: React.PropTypes.func.isRequired,
  }

  setEnabled = this.setEnabled.bind(this)
  handleRefresh = this.handleRefresh.bind(this)

  setEnabled(e) {
    let prefs = Object.assign({}, this.props.prefs)
    prefs.enabled = e.target.checked
    this.props.setPrefs('provider.cdg', prefs)
  }

  handleRefresh() {
    this.props.providerRefresh('cdg')
  }

  render() {
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
          <input type='checkbox' checked={enabled} onChange={this.setEnabled}/>
          <strong> CD+Graphics</strong>
        </label>
        <button onClick={this.handleRefresh}>Refresh</button>
        {paths}
      </div>
    )
  }
}
