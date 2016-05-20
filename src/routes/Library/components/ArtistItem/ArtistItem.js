import React, { PropTypes } from 'react'
import SwipeToRevealOptions from 'react-swipe-to-reveal-options'
import 'react-swipe-to-reveal-options/react-swipe-to-reveal-options.css'
import styles from './ArtistItem.css'

export const ArtistItem = (props) => {
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

  return (
    <SwipeToRevealOptions
      leftOptions={leftOptions}
      rightOptions={rightOptions}
    >
    {props.name}
    </SwipeToRevealOptions>
  )
}

export default ArtistItem
