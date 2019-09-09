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

        <div onClick={this.toggleVisualizerCtrl} styleName='visualizer'>
          <Icon icon='TUNE' size={40}/>
        </div>

        {props.isPlayer && screenfull.isEnabled &&
          <div onClick={handleFullscreen} styleName='fullscreen'>
            <Icon icon='FULLSCREEN' size={48}/>
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
  if (screenfull.isEnabled) {
    const el = document.getElementById('player-fs-container')
    screenfull.request(el)
  }
}
