import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import { RadioGroup, Radio } from 'react-radio-group'
import './ViewOptions.css'

class ViewOptions extends React.Component {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
  }

  state = {
    filter: 'all',
  }

  handleFilterChange = filter => {
    this.setState({ filter })
  }

  render () {
    const { isExpanded } = this.props
    const { filter } = this.state

    return (
      <div className='bg-blur' styleName='container'>
        <div styleName={'content ' + (isExpanded ? 'expanded' : 'collapsed')}>
          <RadioGroup
            name='filter'
            selectedValue={this.state.filter}
            onChange={this.handleFilterChange}
            styleName='radioGroup'
          >
            <label styleName={'radioLabel ' + (filter === 'all' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='all' />All
            </label>
            <label styleName={'radioLabel ' + (filter === 'starred' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='starred' />Starred
            </label>
            <label styleName={'radioLabel ' + (filter === 'hidden' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='hidden' />Hidden
            </label>
          </RadioGroup>
        </div>
      </div>
    )
  }
}

export default ViewOptions
