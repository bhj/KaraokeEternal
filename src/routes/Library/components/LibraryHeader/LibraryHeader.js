import React, { PropTypes } from 'react'
import classes from './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    searchLibrary: PropTypes.func.isRequired,
  }

  state = {
    value: '',
  }

  handleChange = this.handleChange.bind(this)

  handleChange(event) {
    this.setState({value: event.target.value})
    this.props.searchLibrary(event.target.value)
  }

  render () {
    return (
      <input type="search"
        className={classes.search}
        placeholder="search library"
        value={this.state.value}
        onChange={this.handleChange}
      />
    )
  }
}

export default LibraryHeader
