import React from 'react'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: React.PropTypes.object.isRequired,
    setPrefs: React.PropTypes.func.isRequired,
    providerRefresh: React.PropTypes.func.isRequired,
  }

  toggleEnabled = this.toggleEnabled.bind(this)
  handleRefresh = this.handleRefresh.bind(this)

  toggleEnabled(e) {
    e.preventDefault()
    let prefs = Object.assign({}, this.props.prefs)
    prefs.enabled = !prefs.enabled
    this.props.setPrefs('provider.cdg', prefs)
  }

  handleRefresh() {
    this.props.providerRefresh('cdg')
  }

  render() {
    const { prefs } = this.props
    let paths = prefs.paths || []

    paths = paths.map(path => (
      <p key={path}>{path}</p>
    ))

    return (
      <div>
        <label>
          <input type='checkbox' checked={prefs.enabled} onClick={this.toggleEnabled}/>
          <strong> CD+Graphics</strong>
        </label>
        <button onClick={this.handleRefresh}>Refresh</button>
        {paths}
      </div>
    )
  }
}
