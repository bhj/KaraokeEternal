import PropTypes from 'prop-types'
import React from 'react'
import Providers from 'providers' // src/providers
import HttpApi from 'lib/HttpApi'
import Icon from 'components/Icon'
import './ProviderPrefs.css'

const api = new HttpApi('/api/providers')

export default class ProviderPrefs extends React.Component {
  static propTypes = {
    providers: PropTypes.object.isRequired,
    // actions
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
    const arr = this.state.expanded.slice()
    arr.indexOf(name) === -1 ? arr.push(name) : arr.splice(arr.indexOf(name), 1)
    this.setState({ expanded: arr })
  }

  toggleEnabled (name) {
    const enable = !this.props.providers.entities[name].isEnabled
    api('PUT', `/enable?provider=${name}&enable=${enable}`)
      .then(() => {
        // success; update data
        this.props.fetchProviders()
      }).catch(err => {
        alert(err)
      })
  }

  handleRefresh = () => {
    // scan with all enabled providers
    this.props.requestScan()
  }

  render () {
    return (
      <div>
        {this.props.providers.result
          .filter(name => typeof this.props.providers.entities[name] === 'object')
          .filter(name => typeof Providers[name] === 'object')
          .filter(name => typeof Providers[name.prefsComponent === 'object'])
          .map((name, i) => {
            const Component = Providers[name].prefsComponent
            const isExpanded = this.state.expanded.includes(name)
            const isLast = i === this.props.providers.result.length - 1

            return (
              <div key={i} styleName={isLast ? 'provider-last' : 'provider'}>
                <div styleName='provider-title'>
                  <div>
                    <label>
                      <input type='checkbox'
                        checked={this.props.providers.entities[name].isEnabled}
                        onChange={() => this.toggleEnabled(name)}
                      /> {Providers[name].title}
                    </label>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }} onClick={(e) => this.toggleExpanded(e, name)}>
                    <div style={{ display: 'inline-block' }}>
                      <Icon icon={isExpanded ? 'EXPAND_LESS' : 'EXPAND_MORE'} size={32} styleName='icon' />
                    </div>
                  </div>
                </div>

                <Component
                  prefs={this.props.providers.entities[name].prefs}
                  fetchProviders={this.props.fetchProviders}
                  requestScan={this.props.requestScan}
                  style={{ display: isExpanded ? 'block' : 'none' }}
                />
              </div>
            )
          }
          )}
      </div>
    )
  }
}
