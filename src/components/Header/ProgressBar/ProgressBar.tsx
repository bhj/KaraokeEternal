import React from 'react'
import Button from 'components/Button'
import styles from './ProgressBar.css'

interface ProgressBarProps {
  isActive: boolean
  onCancel: () => void
  pct: number
  text: string
}

export default class ProgressBar extends React.Component<ProgressBarProps> {
  state = {
    isCanceling: false,
    isVisible: false,
  }

  handleCancelClick = () => {
    if (this.props.isActive && !this.state.isCanceling) {
      this.setState({ isCanceling: true })
      this.props.onCancel()
    } else {
      this.setState({ isVisible: false })
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.isActive && !prevProps.isActive) {
      this.setState({ isVisible: true, isCanceling: false })
    } else if (this.state.isCanceling && this.props.text !== prevProps.text) {
      // only show 'Stopping...' until the next update
      this.setState({ isCanceling: false })
    }
  }

  render () {
    const { state, props } = this
    if (!state.isVisible) return null

    return (
      <div className={styles.container} style={{ backgroundSize: props.pct + '% 100%' }}>
        <p className={styles.text}>{state.isCanceling ? 'Stopping...' : props.text}</p>
        <Button
          className={props.isActive ? styles.cancel : styles.close}
          icon='CLEAR'
          onClick={this.handleCancelClick}
          size={40}
        />
      </div>
    )
  }
}
