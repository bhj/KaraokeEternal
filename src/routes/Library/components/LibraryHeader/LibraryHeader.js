import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import Icon from 'components/Icon'
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
          <i className='material-icons' styleName='searchIcon'>search</i>
          <input type='search'
            styleName='searchInput'
            placeholder='search library'
            value={this.state.value}
            onChange={this.handleChange}
          />
          {this.props.searchTerm &&
            <div onClick={this.clearSearch}>
              <Icon icon='CLEAR' size={36} styleName='clear' />
            </div>
          }
        </div>
      </Header>
    )
  }
}

export default LibraryHeader
