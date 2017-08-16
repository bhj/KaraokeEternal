import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers' // src/providers
import './ProviderPrefs.css'

export default class ProviderPrefs extends React.Component {
  static propTypes = {
    providers: PropTypes.object.isRequired,
    // setEnabled: PropTypes.func.isRequired,
    fetchProviders: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    expanded: [],
  }

  componentDidMount () {
    this.props.fetchProviders()
  }

  toggleExpanded (e, name) {
    if (e.target.nodeName !== 'DIV') return

    const cur = this.state.expanded.slice()
    const idx = cur.indexOf(name)
    idx === -1 ? cur.push(name) : cur.splice(idx, 1)
    this.setState({ expanded: cur })
  }

  handleRefresh = () => {
    // scan with all enabled providers
    this.props.requestScan()
  }

  render () {
    return (
      <div>
        {this.props.providers.result
          .filter(name => typeof Providers[name] === 'object')
          .filter(name => typeof Providers[name.prefsComponent === 'object'])
          .map((name, i) => {
            const Component = Providers[name].prefsComponent
            return (
              <div key={i} styleName='provider' onClick={(e) => this.toggleExpanded(e, name)}>
                <label>
                  <input type='checkbox' checked /> {Providers[name].title}
                </label>
                <Component style={{ display: this.state.expanded.includes(name) ? 'block' : 'none' }} />
              </div>
            )
          }
          )}
      </div>
    )
  }
}
