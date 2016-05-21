import React, { PropTypes } from 'react'
import SwipeToRevealOptions from 'react-swipe-to-reveal-options'
import 'react-swipe-to-reveal-options/react-swipe-to-reveal-options.css'
import styles from './SwipeableItem.css'

class SwipeableItem extends React.Component {
  static propTypes = {
    onItemClick: PropTypes.func.isRequired,
    onSwipeReveal: PropTypes.func.isRequired
  }

  render() {
    let leftOptions =  [{
       label: 'Trash',
       class: styles.trash,
       action: 'trash'
     }]

     let rightOptions = [{
       label: 'Move',
       class: styles.move,
       action: 'move'
     },{
       label: 'Archive',
       class: styles.archive,
       action: 'archive'
     }]

     return (
       <SwipeToRevealOptions
         leftOptions={leftOptions}
         onLeftClick={opt => this.props.onItemClick(opt.action)}
         rightOptions={rightOptions}
         onRightClick={opt => this.props.onItemClick(opt.action)}
         ref={(c) => this._ref = c}
         onReveal={() => this.props.onSwipeReveal(this._ref)}
       >
         {this.props.children}
       </SwipeToRevealOptions>
     )
  }
}

export default SwipeableItem
