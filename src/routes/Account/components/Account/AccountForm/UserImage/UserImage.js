import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Icon from 'components/Icon'
import loadImage from 'blueimp-load-image'
import './UserImage.css'

export default class AccountForm extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  state = {
    isLoading: true,
    imageURL: this.props.user.userId !== null
      ? `/api/user/image/${this.props.user.userId}?v=${this.props.user.dateUpdated}`
      : null,
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.imageURL !== this.state.imageURL) {
      URL.revokeObjectURL(prevState.imageURL)
    }
  }

  render () {
    return (
      <div styleName='container'>
        {!this.state.imageURL &&
          <Icon icon='ACCOUNT_BOX' size={75} styleName='placeholder'/>
        }

        {this.state.imageURL &&
            <img src={this.state.imageURL} width={100} height={75}
              onLoad={this.handleImgLoad}
              onError={this.handleImgError}
            />
        }

        {this.state.imageURL && !this.state.isLoading &&
            <Icon icon='CLEAR' size={28} onClick={this.handleImgClear} styleName='btnClear'/>
        }

        <input type='file' accept='image/*' onChange={this.handleChoose} styleName='fileInput' tabIndex='-1'/>
      </div>
    )
  }

  handleImgLoad = () => {
    this.setState({ isLoading: false })
  }

  handleImgError = e => {
    this.setState({ imageURL: null, isLoading: false })
  }

  handleImgClear = () => {
    this.setState({ imageURL: null })
    this.props.onSelect(null)
  }

  handleChoose = e => {
    const file = e.target.files[0]

    if (file) {
      loadImage(file, canvas => {
        if (canvas.type === 'error') {
          return alert('The image could not be loaded.')
        }

        const scaled = loadImage.scale(canvas, {
          maxWidth: 400,
          maxHeight: 300,
          crop: true,
          downsamplingRatio: 0.5,
        })

        scaled.toBlob(blob => {
          this.setState({
            imageURL: URL.createObjectURL(blob)
          })

          this.props.onSelect(blob)
        }, 'image/jpeg')
      }, {
        // loadImage options
        canvas: true,
        aspectRatio: 4 / 3,
        orientation: true,
      })
    }
  }
}
