import React, { PropTypes } from 'react'
import Header from 'components/Header'
import { push } from 'react-router-redux'
import ArtistList from '../../routes/Artists/containers/ArtistList'
import classes from './LibraryView.css'

class LibraryView extends React.Component {
  static propTypes = {
    artists: PropTypes.object,
    routerParams: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
  }

  render () {
    let params = this.props.routerParams
    let headerTitle = params.artistId ? this.props.artists[params.artistId].name : 'Artists'

    return (
      <div className={classes.flexContainer + ' ' + classes.flexItem}>
        <Header title={headerTitle}/>
        <p>Some search shit goes here</p>
        <div className={classes.viewContainer}>
          <div style={{display: params.artistId ? 'none' : 'block'}} className={classes.view}>
            <ArtistList onArtistSelect={this.handleArtistSelect.bind(this)}/>
          </div>
          <div style={{display: params.artistId ? 'block' : 'none'}} className={classes.view}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }

  handleArtistSelect(id){
    this.props.dispatch(push('/library/artist/'+id))
  }
}

export default LibraryView
