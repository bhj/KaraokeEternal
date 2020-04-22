import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './PlayerPrefs.css'

export default class PlayerPrefs extends React.Component {
  static propTypes = {
    isReplayGainEnabled: PropTypes.bool.isRequired,
    // actions
    setPref: PropTypes.func.isRequired,
    requestScan: PropTypes.func.isRequired,
  }

  state = {
    isExpanded: false,
  }

  toggleExpanded = () => {
    this.setState({ isExpanded: !this.state.isExpanded })
  }

  toggleCheckbox = (e) => {
    this.props.setPref(e.target.name, !this.props[e.target.name])
  }

  render () {
    return (
      <div styleName='container'>
        <div styleName='heading' onClick={this.toggleExpanded}>
          <Icon icon='TELEVISION_PLAY' size={28} styleName='icon' />
          <div styleName='title'>Player</div>
          <div>
            <Icon icon={this.state.isExpanded ? 'CHEVRON_DOWN' : 'CHEVRON_RIGHT'} size={24} styleName='icon' />
          </div>
        </div>

        <div styleName='content' style={{ display: this.state.isExpanded ? 'block' : 'none' }}>
          <label>
            <input type='checkbox'
              checked={this.props.isReplayGainEnabled}
              onChange={this.toggleCheckbox}
              name='isReplayGainEnabled'
            /> ReplayGain (clip-safe)
          </label>
        </div>
      </div>
    )
  }
}
