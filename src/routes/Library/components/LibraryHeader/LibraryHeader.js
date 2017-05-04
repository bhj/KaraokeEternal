import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    searchTerm: PropTypes.string.isRequired,
    // actions
    searchLibrary: PropTypes.func.isRequired,
    searchReset: PropTypes.func.isRequired,
  }

  state = {
    value: this.props.searchTerm,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.searchLibrary(event.target.value)
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.searchReset()
  }

  render () {
    return (
      <Header>
        <div styleName='container'>
          <input type='search'
            styleName='search'
            placeholder='search library'
            value={this.state.value}
            onChange={this.handleChange}
          />
          {this.props.searchTerm &&
            <div onClick={this.clearSearch} styleName='clear'>
              <i className='material-icons'>clear</i>
            </div>
          }
        </div>
      </Header>
    )
  }
}

export default LibraryHeader
