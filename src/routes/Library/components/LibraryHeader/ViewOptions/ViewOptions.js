import PropTypes from 'prop-types'
import React from 'react'
import { RadioGroup, Radio } from 'react-radio-group'
import './ViewOptions.css'

class ViewOptions extends React.Component {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    filterStatus: PropTypes.string.isRequired,
    // actions
    setFilterStatus: PropTypes.func.isRequired,
  }

  handleFilterStatusChange = status => {
    this.props.setFilterStatus(status)
  }

  render () {
    const { isExpanded, filterStatus } = this.props

    return (
      <div className='bg-blur' styleName='container'>
        <div styleName={'content ' + (isExpanded ? 'expanded' : 'collapsed')}>
          <RadioGroup
            name='view'
            selectedValue={filterStatus}
            onChange={this.handleFilterStatusChange}
            styleName='radioGroup'
          >
            <label styleName={'radioLabel ' + (filterStatus ? 'inactive' : 'active')}>
              <Radio styleName='radioInput' value='' />All
            </label>
            <label styleName={'radioLabel ' + (filterStatus === 'starred' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='starred' />Starred
            </label>
            <label styleName={'radioLabel ' + (filterStatus === 'hidden' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='hidden' />Hidden
            </label>
          </RadioGroup>
        </div>
      </div>
    )
  }
}

export default ViewOptions
