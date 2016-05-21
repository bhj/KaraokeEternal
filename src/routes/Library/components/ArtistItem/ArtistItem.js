import React, { PropTypes } from 'react'
import SwipeToRevealOptions from 'react-swipe-to-reveal-options'
import 'react-swipe-to-reveal-options/react-swipe-to-reveal-options.css'
import styles from './ArtistItem.css'

class ArtistItem extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    onItemClick: PropTypes.func.isRequired
  }

  render() {
    let leftOptions =  [{
       label: 'Trash',
       class: styles.trash
     }]

     let rightOptions = [{
       label: 'Move',
       class: styles.move
     },{
       label: 'Archive',
       class: styles.archive
     }]

     let { id } = this.props

     return (
       <SwipeToRevealOptions
         leftOptions={leftOptions}
         onLeftClick={opt => this.props.onItemClick({...opt, id})}
         rightOptions={rightOptions}
         onRightClick={opt => this.props.onItemClick({...opt, id})}
         ref={'row' + id}
         closeOthers={() => this.handleCloseOthers(id)}
       >
       {this.props.name}
       </SwipeToRevealOptions>
     )
  }

  handleCloseOthers(i) {
     Object.keys(this.refs).forEach(ref => {
      //  console.log(ref)

        if (ref !== 'row' + i && ref.close) {
           ref.close();
        }
     })
  }
}

export default ArtistItem
