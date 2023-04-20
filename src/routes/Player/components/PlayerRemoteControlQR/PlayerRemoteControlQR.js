import PropTypes from 'prop-types'
import React from 'react'
import styles from './PlayerRemoteControlQR.css'
import QRCode from "react-qr-code";


class PlayerRemoteControlQR extends React.Component {
  static propTypes = {
    // width: PropTypes.number.isRequired,
  }

  frameId = null

  componentDidMount() {

  }

  componentDidUpdate(prevProps, prevState) {

  }

  componentWillUnmount() {
  }

  render() {
    // const { width } = this.props
    const qrValue = document.baseURI;


    return (
      <div className={styles.container} style={{ height: "auto", margin: "0 auto", maxWidth: 82, width: "100%", position: "absolute", bottom: 16, left: 16, backgroundColor: "#fff", padding: "2px", opacity: 0.8 }}>
        <QRCode
          size={256}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={qrValue}
          viewBox={`0 0 256 256`}
        />
      </div>
    )
  }


}

export default PlayerRemoteControlQR
