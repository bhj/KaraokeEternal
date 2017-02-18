import React, { PropTypes } from 'react'
import VolumeSlider from './VolumeSlider'
import classes from './PlaybackCtrl.css'

const PlaybackCtrl = (props) => (
  <div className={classes.container}>
    {!props.isPlaying &&
      <div onClick={props.requestPlay} className={classes.play}>
        <i className="material-icons">play_arrow</i>
      </div>
    }
    {props.isPlaying &&
      <div onClick={props.requestPause} className={classes.pause}>
        <i className="material-icons">pause</i>
      </div>
    }

    <div onClick={props.requestPlayNext} className={classes.next + (props.isPlaying ? '' : ' '+classes.disabled)}>
      <i className="material-icons">skip_next</i>
    </div>

    <VolumeSlider
      className={classes.volume}
      volume={props.volume}
      onVolumeChange={props.requestVolume}
    />
  </div>
)

PlaybackCtrl.PropTypes = {
  isPlaying: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  // actions
  requestPlay: PropTypes.func.isRequired,
  requestPlayNext: PropTypes.func.isRequired,
  requestPause: PropTypes.func.isRequired,
  requestVolume: PropTypes.func.isRequired,
}

export default PlaybackCtrl
