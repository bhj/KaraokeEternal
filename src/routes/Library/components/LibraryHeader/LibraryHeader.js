import React, { PropTypes } from 'react'
import classes from './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    isSearching: PropTypes.bool.isRequired,
    // actions
    searchLibrary: PropTypes.func.isRequired,
  }

  state = {
    value: '',
  }

  handleChange = this.handleChange.bind(this)
  clearSearch = this.clearSearch.bind(this)

  handleChange(event) {
    this.setState({value: event.target.value})
    this.props.searchLibrary(event.target.value)
  }

  clearSearch() {
    this.setState({value: ''})
    this.props.searchLibrary('')
  }

  render () {
    return (
      <div className={classes.container}>
        <input type="search"
          className={classes.search}
          placeholder="search library"
          value={this.state.value}
          onChange={this.handleChange}
        />
        {this.props.isSearching &&
          <div onClick={this.clearSearch} className={classes.clear}>
            <i className='material-icons'>clear</i>
          </div>
        }
      </div>
    )
  }
}

export default LibraryHeader
