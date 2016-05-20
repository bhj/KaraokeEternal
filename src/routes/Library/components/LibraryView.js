import React, { PropTypes } from 'react'
import SwipeToRevealOptions from 'react-swipe-to-reveal-options'
import 'react-swipe-to-reveal-options/react-swipe-to-reveal-options.css'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import styles from 'react-virtualized/styles.css'
import stroStyles from './LibraryView.css'

class LibraryView extends React.Component {
  static propTypes = {
    fetchArtists: PropTypes.func.isRequired,
    library: PropTypes.object.isRequired
  }

  componentWillMount() {
    if (! this.props.library.artists) {
      this.props.fetchArtists()
    }
  }

  _rowRenderer ({ index }) {
    let leftOptions =  [{
       label: 'Trash',
       class: stroStyles.trash
     }]

     let rightOptions = [{
       label: 'Move',
       class: stroStyles.move
     },{
       label: 'Archive',
       class: stroStyles.archive
     }]
    const artist = this.props.library.artists[index]
    return (
      <SwipeToRevealOptions
        key={index}
        leftOptions={leftOptions}
        rightOptions={rightOptions}
        className={'stroContainer'}
      >
        {artist.name}
      </SwipeToRevealOptions>
    )
  }

  render () {
    let artists = this.props.library.artists
    if (!artists) return null

    return (
      <AutoSizer>
        {({ height, width }) => (
          <VirtualScroll
            width={width}
            height={height}
            rowCount={artists.length}
            rowHeight={65}
            className={styles.VirtualScroll}
            rowRenderer={(index) => this._rowRenderer(index)}
          />
        )}
      </AutoSizer>
    )
  }
}

export default LibraryView
