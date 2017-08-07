import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers' // src/providers

export default class ProviderPrefs extends React.Component {
  static propTypes = {
    providers: PropTypes.object.isRequired,
    // setEnabled: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.props.fetchProviders()
  }

  handleRefresh = () => {
    // scan with all enabled providers
    this.props.requestScan()
  }

  render () {
    return (
      <div style={{ overflow: 'hidden' }}>
        {this.props.providers.result
          .filter(name => typeof Providers[name] === 'object')
          .filter(name => typeof Providers[name.prefsComponent === 'object'])
          .map((name, i) => {
            const Component = Providers[name].prefsComponent
            return (
              <Component key={i} isExpanded />
            )
          }
          )}
      </div>
    )
  }
}
