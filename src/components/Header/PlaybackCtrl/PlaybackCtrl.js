import PropTypes from 'prop-types'
import React from 'react'
import screenfull from 'screenfull'
import Icon from 'components/Icon'
import VolumeSlider from './VolumeSlider'
import NoPlayer from './NoPlayer'
import VisualizerCtrl from './VisualizerCtrl'
import './PlaybackCtrl.css'

export default class PlaybackCtrl extends React.Component {
  static propTypes = {
    isAdmin: PropTypes.bool.isRequired,
    isInRoom: PropTypes.bool.isRequired,
    isPlayer: PropTypes.bool.isRequired,
    status: PropTypes.object.isRequired,
    // actions
    requestBackgroundAlpha: PropTypes.func.isRequired,
    requestPlay: PropTypes.func.isRequired,
    requestPlayNext: PropTypes.func.isRequired,
    requestPause: PropTypes.func.isRequired,
    requestVisualizer: PropTypes.func.isRequired,
    requestVisualizerPreset: PropTypes.func.isRequired,
    requestVolume: PropTypes.func.isRequired,
  }

  state = {
    showVisualizerCtrl: false,
  }

  render () {
    const { props } = this
    const { isPlaying, isPlayerPresent, volume } = props.status

    if (!isPlayerPresent) {
      return (props.isAdmin && props.isInRoom && screenfull.enabled) ? <NoPlayer /> : null
    }

    return (
      <div styleName='container'>
        {isPlaying &&
          <div onClick={props.requestPause}>
            <Icon icon='PAUSE' size={42} styleName='pause' />
          </div>
        }
        {!isPlaying &&
          <div onClick={props.requestPlay}>
            <Icon icon='PLAY' size={42} styleName='play' />
          </div>
        }

        <div onClick={props.requestPlayNext}>
          <Icon icon='PLAY_NEXT' size={48} styleName='next'/>
        </div>

        <VolumeSlider
          volume={volume}
          onVolumeChange={props.requestVolume}
        />

        <div onClick={this.toggleVisualizerCtrl}>
          <Icon icon='TUNE' size={40} styleName='visualizer'/>
        </div>

        {props.isPlayer && screenfull.enabled &&
          <div onClick={handleFullscreen}>
            <Icon icon='FULLSCREEN' size={48} styleName='fullscreen' />
          </div>
        }

        <VisualizerCtrl
          {...props.status.visualizer}
          bgAlpha={props.status.bgAlpha}
          isVisible={this.state.showVisualizerCtrl}
          onBackgroundAlphaChange={props.requestBackgroundAlpha}
          onChangePreset={props.requestVisualizerPreset}
          onChange={props.requestVisualizer}
          onClose={this.toggleVisualizerCtrl}
        />
      </div>
    )
  }

  toggleVisualizerCtrl = () => {
    this.setState({ showVisualizerCtrl: !this.state.showVisualizerCtrl })
  }
}

const handleFullscreen = () => {
  if (screenfull.enabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}
