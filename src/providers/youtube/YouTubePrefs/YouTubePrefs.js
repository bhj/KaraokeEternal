import PropTypes from 'prop-types'
import React from 'react'

export default class YouTubePrefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    providerRefresh: PropTypes.func.isRequired,
  }

  updateEnabled = (e) => {
    this.props.setPrefs('provider.youtube', { enabled: e.target.checked })
  }

  handleRefresh = () => {
    this.props.providerRefresh('youtube')
  }

  render () {
    const { prefs } = this.props
    if (!prefs) return null

    return (
      <div>
        <label>
          <input type='checkbox' checked={prefs.enabled} onChange={this.updateEnabled} />
          <strong>YouTube Channels</strong>
        </label>
        <button onClick={this.handleRefresh}>Refresh</button>
      </div>
    )
  }
}
