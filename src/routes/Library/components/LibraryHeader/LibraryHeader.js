import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import HeaderPortal from 'components/HeaderPortal'
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

  state = {
    value: this.props.filterStr,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.setFilterStr(event.target.value)
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.resetFilterStr()
  }

  render () {
    const { filterStr, filterStarred } = this.props

    return (
      <HeaderPortal>
        <div styleName='container'>
          <Icon icon='MAGNIFIER' size={40} styleName={filterStr ? 'active' : 'inactive'} />
          <input type='search'
            styleName='searchInput'
            placeholder='search'
            value={this.state.value}
            onChange={this.handleChange}
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
      </HeaderPortal>
    )
  }
}

export default LibraryHeader
