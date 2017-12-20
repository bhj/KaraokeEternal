import PropTypes from 'prop-types'
import React from 'react'
import { RadioGroup, Radio } from 'react-radio-group'
import './ViewOptions.css'

class ViewOptions extends React.Component {
  static propTypes = {
    isExpanded: PropTypes.bool.isRequired,
    view: PropTypes.string.isRequired,
    // actions
    changeView: PropTypes.func.isRequired,
  }

  handleViewChange = view => {
    this.props.changeView(view)
  }

  render () {
    const { isExpanded, view } = this.props

    return (
      <div className='bg-blur' styleName='container'>
        <div styleName={'content ' + (isExpanded ? 'expanded' : 'collapsed')}>
          <RadioGroup
            name='view'
            selectedValue={view}
            onChange={this.handleViewChange}
            styleName='radioGroup'
          >
            <label styleName={'radioLabel ' + (view === 'all' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='all' />All
            </label>
            <label styleName={'radioLabel ' + (view === 'starred' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='starred' />Starred
            </label>
            <label styleName={'radioLabel ' + (view === 'hidden' ? 'active' : 'inactive')}>
              <Radio styleName='radioInput' value='hidden' />Hidden
            </label>
          </RadioGroup>
        </div>
      </div>
    )
  }
}

export default ViewOptions
