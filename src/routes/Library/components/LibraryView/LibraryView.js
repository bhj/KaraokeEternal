import React, { PropTypes } from 'react'
import Header from 'components/Header'
import { push } from 'react-router-redux'
import ArtistList from '../../routes/Artists/components/ArtistList'
import classes from './LibraryView.css'

class LibraryView extends React.Component {
  static propTypes = {
    library: PropTypes.object,
    routerParams: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  }

  render () {
    let params = this.props.routerParams
    let display = params.artistId ? 0 : 1

    return (
      <div className={classes.flexContainer + ' ' + classes.flexItem}>
        <Header title="Artists"/>
        <p>Some search shit goes here</p>
        <div className={classes.flexItem} style={{opacity: display}}>
            <ArtistList artists={this.props.library.artists} onArtistSelect={this.handleArtistSelect.bind(this)}/>
        </div>
      </div>
    )
  }

  handleArtistSelect(id){
    this.props.dispatch(push('/library/artist/'+id))
  }
}

export default LibraryView
