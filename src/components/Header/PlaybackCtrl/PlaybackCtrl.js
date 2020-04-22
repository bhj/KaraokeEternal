import PropTypes from 'prop-types'
import React from 'react'
import screenfull from 'screenfull'
import Icon from 'components/Icon'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import DisplayCtrl from './DisplayCtrl'
import './PlaybackCtrl.css'

export default class PlaybackCtrl extends React.Component {
  static propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    isInRoom: PropTypes.bool.isRequired,
    isPlayer: PropTypes.bool.isRequired,
    status: PropTypes.object.isRequired,
    // actions
    requestOptions: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestVolume: PropTypes.func.isRequired,
  }

  state = {
    isVisible: false,
  }

  toggleDisplayCtrl = () => this.setState({ isVisible: !this.state.isVisible })

  render () {
    const { props } = this
    const { isPlaying, isPlayerPresent, volume } = props.status

    if (!isPlayerPresent) {
      return (props.isAdmin && props.isInRoom && screenfull.isEnabled) ? <NoPlayer /> : null
    }

    return (
      <div styleName='container'>
        {isPlaying &&
          <div onClick={props.requestPause} styleName='pause'>
            <Icon icon='PAUSE' size={42}/>
          </div>
        }
        {!isPlaying &&
          <div onClick={props.requestPlay} styleName='play'>
            <Icon icon='PLAY' size={42}/>
          </div>
        }

        <div onClick={props.requestPlayNext} styleName='next'>
          <Icon icon='PLAY_NEXT' size={48}/>
        </div>

        <VolumeSlider
          volume={volume}
          onVolumeChange={props.requestVolume}
        />

        <div onClick={this.toggleDisplayCtrl} styleName='displayCtrl'>
          <Icon icon='TUNE' size={40}/>
        </div>

        {props.isPlayer && screenfull.isEnabled &&
          <div onClick={handleFullscreen} styleName='fullscreen'>
            <Icon icon='FULLSCREEN' size={48}/>
          </div>
        }

        <DisplayCtrl
          alpha={props.status.alpha}
          isAlphaSupported={props.status.isAlphaSupported}
          isVisible={this.state.isVisible}
          isVisualizerEnabled={props.status.visualizer.isEnabled}
          isVisualizerSupported={props.status.visualizer.isSupported}
          visualizerPresetName={props.status.visualizer.presetName}
          onClose={this.toggleDisplayCtrl}
          onRequestOptions={props.requestOptions}
        />
      </div>
    )
  }
}

const handleFullscreen = () => {
  if (screenfull.isEnabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}
