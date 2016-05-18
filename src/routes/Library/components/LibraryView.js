import React, { PropTypes } from 'react'
import SwipeToRevealOptions from 'react-swipe-to-reveal-options'
// import classes from './LibraryView.scss'

class LibraryView extends React.Component {
  static propTypes = {
    fetchArtists: PropTypes.func.isRequired,
    library: PropTypes.object.isRequired
  }

  componentWillMount() {
    this.props.fetchArtists()
  }

  render () {
    let artists = this.props.library.artists
    if (!artists) return null

    let leftOptions =  [{
       label: 'Trash',
       class: 'trash'
     }]

     let rightOptions = [{
       label: 'Move',
       class: 'move',
     },{
       label: 'Archive',
       class: 'archive',
     }]

    return (
      <div>
        {artists.map(function(artist) {
          return (
            <SwipeToRevealOptions
              key={artist.id}
              leftOptions={leftOptions}
              rightOptions={rightOptions}
            >
              {artist.name}
            </SwipeToRevealOptions>
          )
        })}
      </div>
    )
  }
}

export default LibraryView
