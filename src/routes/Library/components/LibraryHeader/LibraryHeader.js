import PropTypes from 'prop-types'
import React from 'react'
import Header from 'components/Header'
import Icon from 'components/Icon'
import ViewOptions from './ViewOptions'
import './LibraryHeader.css'

class LibraryHeader extends React.Component {
  static propTypes = {
    filterString: PropTypes.string.isRequired,
    // actions
    setFilterString: PropTypes.func.isRequired,
    resetFilterString: PropTypes.func.isRequired,
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

  toggleViewOptions = () => {
    this.setState({ viewOptions: !this.state.viewOptions })
  }

  render () {
    const { viewOptions } = this.state

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
          {this.props.filterString &&
            <div onClick={this.clearSearch}>
              <Icon icon='CLEAR' size={36} styleName='clear' />
            </div>
          }

          <div onClick={this.toggleViewOptions}>
            <Icon icon='VISIBILITY' size={36} styleName={viewOptions ? 'eye-active' : 'eye'} />
          </div>
        </div>

        <ViewOptions isExpanded={this.state.viewOptions} />
      </Header>
    )
  }
}

export default LibraryHeader
