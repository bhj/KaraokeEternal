import React, { PropTypes } from 'react'
import classes from './QueueItem.css'

export const QueueItem = (props) => (
  <div style={props.style}>
    <div className={classes.container} style={{backgroundSize: props.pctPlayed+'% 100%'}}>
      <div className={classes.wait}>
        {props.isActive ? 'now' : props.wait}
      </div>

      <div className={classes.primary}>
        <div className={classes.user}>{props.name}</div>
        <div className={classes.title}>{props.artist} - {props.title}</div>
      </div>

      {props.hasErrors &&
        <div onClick={props.onErrorInfoClick} className={classes.errorInfo}>
          <i className='material-icons'>info_outline</i>
        </div>
      }
      {props.canSkip &&
        <div onClick={props.onSkipClick} className={classes.skip}>
          <i className='material-icons'>skip_next</i>
        </div>
      }
      {props.canRemove &&
        <div onClick={props.onRemoveClick} className={classes.remove}>
          <i className='material-icons'>clear</i>
        </div>
      }
    </div>
  </div>
)

QueueItem.propTypes = {
  title: PropTypes.string.isRequired,
  artist: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  hasErrors: PropTypes.bool.isRequired,
  canSkip: PropTypes.bool.isRequired,
  onSkipClick: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  onRemoveClick: PropTypes.func.isRequired,
  onErrorInfoClick: PropTypes.func.isRequired,
}

export default QueueItem
