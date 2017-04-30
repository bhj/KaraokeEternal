import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers'

export default class Prefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    setPrefs: PropTypes.func.isRequired,
    isAdmin: PropTypes.bool.isRequired,
  }

  render () {
    const { prefs, isAdmin } = this.props

    return (
      <div>
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
              />
            )
          }
        }
        )}
      </div>
    )
  }
}
