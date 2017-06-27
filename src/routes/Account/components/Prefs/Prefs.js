import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'
import './Prefs.css'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
    isAdmin: PropTypes.bool.isRequired,
  }

  render () {
    const { prefs, isAdmin } = this.props

    return (
      <div>
        <h1 styleName='title'>Providers</h1>

        {Object.keys(Providers).map((p, i) => {
          const Component = Providers[p].prefComponent

          // prefs may not have loaded yet
          if (Component && prefs.provider && prefs.provider[p]) {
            return (
              <Component
                key={i}
                prefs={prefs.provider[p]}
                isAdmin={isAdmin}
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
