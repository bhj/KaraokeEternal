import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import Icon from 'components/Icon'
import ViewOptions from './ViewOptions'
import './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    searchStr: PropTypes.string.isRequired,
    // actions
    searchLibrary: PropTypes.func.isRequired,
  }

  state = {
    value: this.props.searchStr,
    viewOptions: false,
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.searchLibrary(event.target.value)
  }

  clearSearch = () => {
    this.setState({ value: '' })
    this.props.searchLibrary('')
  }

  toggleViewOptions = () => {
    this.setState({ viewOptions: !this.state.viewOptions })
  }

  render () {
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
          {this.props.searchStr &&
            <div onClick={this.clearSearch}>
              <Icon icon='CLEAR' size={36} styleName='clear' />
            </div>
          }

          <div onClick={this.toggleViewOptions}>
            <Icon icon='VISIBILITY' size={36} styleName='magnifier' />
          </div>
        </div>

        <ViewOptions isExpanded={this.state.viewOptions} />
      </Header>
    )
  }
}

export default LibraryHeader
