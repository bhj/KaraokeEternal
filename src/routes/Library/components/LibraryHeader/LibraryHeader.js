import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import Icon from 'components/Icon'
import './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    filterString: PropTypes.string.isRequired,
    filterStarred: PropTypes.bool.isRequired,
    // actions
    setFilterString: PropTypes.func.isRequired,
    resetFilterString: PropTypes.func.isRequired,
    toggleFilterStarred: PropTypes.func.isRequired,
  }

  state = {
    value: this.props.filterString,
    viewOptions: false,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.setFilterString(event.target.value)
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.resetFilterString()
  }

  toggleStarred = () => {
    this.props.toggleFilterStarred()
  }

  render () {
    const { filterString, filterStarred } = this.props

    return (
      <Header>
        <div styleName='container'>
          <Icon icon='MAGNIFIER' size={36} styleName='magnifier' />
          <input type='search'
            styleName='searchInput'
            placeholder='search library'
            value={this.state.value}
            onChange={this.handleChange}
          />
          {filterString &&
            <div onClick={this.clearSearch}>
              <Icon icon='CLEAR' size={36} styleName='clear' />
            </div>
          }

          <div onClick={this.props.toggleFilterStarred}>
            <Icon icon='STAR_FULL' size={36} styleName={filterStarred ? 'active' : 'inactive'} />
          </div>
        </div>
      </Header>
    )
  }
}

export default LibraryHeader
