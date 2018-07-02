import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import Header from 'components/Header'
import './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    filterStr: PropTypes.string.isRequired,
    filterStarred: PropTypes.bool.isRequired,
    // actions
    setFilterStr: PropTypes.func.isRequired,
    resetFilterStr: PropTypes.func.isRequired,
    toggleFilterStarred: PropTypes.func.isRequired,
  }

  searchInput = React.createRef()
  state = {
    value: this.props.filterStr,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.setFilterStr(event.target.value)
  }

  handleMagnifierClick = () => {
    this.state.value.trim() ? this.clearSearch() : this.searchInput.current.focus()
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.resetFilterStr()
  }

  render () {
    const { filterStr, filterStarred } = this.props

    return (
      <Header>
        <div styleName='container'>
          <Icon icon='MAGNIFIER'
            size={40}
            styleName={filterStr ? 'active' : 'inactive'}
            onClick={this.handleMagnifierClick}
          />
          <input type='search'
            styleName='searchInput'
            placeholder='search'
            value={this.state.value}
            onChange={this.handleChange}
            ref={this.searchInput}
          />
          {filterStr &&
            <div onClick={this.clearSearch}>
              <Icon icon='CLEAR' size={40} styleName='clear' />
            </div>
          }

          <div onClick={this.props.toggleFilterStarred}>
            <Icon icon='STAR_FULL' size={40} styleName={filterStarred ? 'active' : 'inactive'} />
          </div>
        </div>
      </Header>
    )
  }
}

export default LibraryHeader
