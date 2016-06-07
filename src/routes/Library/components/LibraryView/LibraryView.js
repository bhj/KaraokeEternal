import React, { PropTypes } from 'react'
import Header from 'components/Header'
import { push } from 'react-router-redux'
import ArtistList from '../../routes/Artists/containers/ArtistList'
import classes from './LibraryView.css'

class LibraryView extends React.Component {
  static propTypes = {
    routerParams: PropTypes.object,
    routerPath: PropTypes.string,
    doSearch: PropTypes.func.isRequired
  }

  state = {
    search: ''
  }

  render () {
    let isAtRoot = this.props.routerPath === '/library'
    let params = this.props.routerParams
    let headerTitle = params.artistId ? this.props.artists[params.artistId].name : 'Artists'

    return (
      <div className={classes.flexContainer + ' ' + classes.flexItem}>
        <Header title={headerTitle}/>
        <div>
          <input type='text' ref='search' onChange={this.handleSearch.bind(this)} className="form-control" placeholder='search' />
        </div>
        <div className={classes.viewContainer}>
          <div style={{display: isAtRoot ? 'block' : 'none'}} className={classes.view}>
            <ArtistList onArtistSelect={this.handleArtistSelect.bind(this)}/>
          </div>
          <div style={{display: isAtRoot ? 'none' : 'block'}} className={classes.view}>
            {this.props.children}
          </div>
        </div>
      </div>
    )
  }

  handleArtistSelect(id){
    // this.props.dispatch(push('/library/artist/'+id))
  }

  handleSearch(event) {
    if (this.props.routerPath !== '/library/search') {
      this.props.dispatch(push('/library/search'))
    }

    this.props.doSearch(event.target.value)
    // this.setState({search: event.target.value})
    // console.log(event.target.value)
  }}

export default LibraryView
