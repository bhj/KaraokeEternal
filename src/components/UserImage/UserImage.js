import PropTypes from 'prop-types'
import React from 'react'
import Icon from 'components/Icon'
import './UserImage.css'

class UserImage extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    dateUpdated: PropTypes.number.isRequired,
    height: PropTypes.number,
    userId: PropTypes.number.isRequired,
  }

  state = {
    isLoading: true,
    isErrored: false,
  }

  render () {
    const { props, state } = this

    return (
      <>
        {(state.isLoading || state.isErrored) && props.height &&
          <Icon icon='ACCOUNT' size={props.height} styleName='placeholder'/>
        }

        {!state.isErrored &&
          <img src={`/api/user/image/${props.userId}?v=${props.dateUpdated}`}
            onLoad={this.handleImgLoad}
            onError={this.handleImgError}
            className={props.className}
            styleName='image'
            style={{
              display: state.isLoading ? 'none' : 'initial',
              height: props.height ? props.height : null,
            }}
          />
        }
      </>
    )
  }

  handleImgLoad= e => {
    this.setState({ isLoading: false })
  }

  handleImgError = e => {
    this.setState({ isErrored: true, isLoading: false })
  }
}

export default UserImage
