import PropTypes from 'prop-types'
import React from 'react'
import { SkyLightStateless } from 'react-skylight'
import ChannelItem from './ChannelItem'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('/api/provider/youtube')

export default class YouTubePrefs extends React.Component {
  static propTypes = {
    prefs: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired,
    fetchProviders: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isAdding: false,
  }

  updateApiKey = (e) => {
    e.preventDefault()

    api('PUT', `/apiKey`, {
      body: JSON.stringify({ apiKey: this.refs.apiKey.value.toString() })
    })
      .then(() => {
        this.props.fetchProviders()
      }).catch(err => {
        alert(err)
      })
  }

  handleAddClick = () => {
    api('POST', `/channel`, {
      body: JSON.stringify({ channel: this.refs.name.value })
    })
      .then(() => {
        this.props.fetchProviders()
        this.setState({ isAdding: false })
      }).catch(err => {
        alert(err)
      })
  }

  handleRemoveClick = (name) => {
    if (!confirm(`Remove "${name}"?`)) {
      return
    }

    api('DELETE', `/channel/${name}`)
      .then(() => {
        this.props.fetchProviders()
        this.setState({ isAdding: false })
      }).catch(err => {
        alert(err)
      })
  }

  handleKeyPress = (e) => {
    if (e.charCode === 13) {
      this.handleAddClick()
    }
  }

  handleOpenAdder = () => { this.setState({ isAdding: true }) }
  handleCloseAdder = () => { this.setState({ isAdding: false }) }

  handleRefresh = () => {
    this.props.requestScan('youtube')
  }

  render () {
    const { prefs } = this.props

    return (
      <div style={this.props.style}>
        <input type='text' ref='apiKey' placeholder='API key'
          defaultValue={prefs.apiKey}
          onBlur={this.updateApiKey}
        />

        {!prefs.channels.length &&
          <p>No channels configured.</p>
        }

        {prefs.channels.map((name, i) =>
          <ChannelItem key={i} name={name} onRemoveClick={() => this.handleRemoveClick(name)} />
        )}

        <div style={{ display: 'flex' }}>
          <button style={{ flex: 1, width: 'auto' }} onClick={this.handleOpenAdder}>Add Channel</button>
          {prefs.channels.length > 0 &&
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleRefresh}>Refresh</button>
          }
        </div>

        <SkyLightStateless
          isVisible={this.state.isAdding}
          onCloseClicked={this.handleCloseAdder}
          onOverlayClicked={this.handleCloseAdder}
          title='Add Channel'
          dialogStyles={{
            width: '80%',
            height: 'auto',
            left: '10%',
            marginLeft: '0' }}
        >
          <input type='text' ref='name' placeholder='channel name' onKeyPress={this.handleKeyPress} autoFocus />
          <br />
          <div style={{ display: 'flex' }}>
            <button style={{ flex: 1, width: 'auto' }} onClick={this.handleAddClick}>Add Channel</button>
            <button style={{ marginLeft: '.5em', width: 'auto' }} onClick={this.handleCloseAdder}>Cancel</button>
          </div>
        </SkyLightStateless>
      </div>
    )
  }
}
