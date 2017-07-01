import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'

export default class OnlineMedia extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  handleRefresh = () => {
    this.props.requestScan('cdg')
  }

  render () {
    const { prefs } = this.props

    return (
      <div style={{ overflow: 'hidden' }}>
        <h2>Online media</h2>

        {Object.keys(Providers).filter(p => !p.isLocal).map((p, i) => {
          const Component = Providers[p].prefsComponent

          // prefs may not have loaded yet
          if (Component && prefs.provider && prefs.provider[p]) {
            return (
              <Component
                key={i}
                prefs={prefs.provider[p]}
                setPrefs={this.props.setPrefs}
                requestScan={this.props.requestScan}
              />
            )
          }
        }
        )}
      </div>
    )
  }
}
