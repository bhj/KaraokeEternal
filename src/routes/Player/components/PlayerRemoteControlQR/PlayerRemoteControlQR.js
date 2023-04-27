import PropTypes from 'prop-types'
import React from 'react'
import styles from './PlayerRemoteControlQR.css'
import QRCode from "react-qr-code";

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')


class PlayerRemoteControlQR extends React.Component {
  static propTypes = {
    // width: PropTypes.number.isRequired,
    alternate: PropTypes.bool.isRequired,
    size: PropTypes.number.isRequired,
    opacity: PropTypes.number.isRequired,
    roomId: PropTypes.number.isRequired,
  }
  state = {
    position: "bottomLeft",
    room: false,
  };


  frameId = null
  positions = {
    bottomLeft: {
      bottom: 16,
      left: 16,
    },
    bottomRight: {
      bottom: 16,
      right: 16,
    },
  };


  fetchRoom() {
    return api('GET', '/'+this.props.roomId)
      .then(res => {
        this.setState({ room: res.entity });
      })
      .catch(err => {
        console.error(err)
      })
  }

  componentDidMount() {
    this.fetchRoom();
    this.maybeSetupInterval();
  }

  maybeSetupInterval() {
    // on mount, setup a interval to update the position of the QR code
    if (this.props.alternate && !this.interval) {
      this.interval = setInterval(() => {
        this.setState({ position: this.state.position === "bottomLeft" ? "bottomRight" : "bottomLeft" });
      }, 5 * 60 * 1000);
    } else if (!this.props.alternate && this.interval) {
      clearInterval(this.interval);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.maybeSetupInterval();
  }

  componentWillUnmount() {
    // on unmount, clear the interval
    clearInterval(this.interval);
  }

  render() {
    // const { width } = this.props
    let qrValue = document.baseURI;
    qrValue += "?roomId="+this.props.roomId;

    if (this.state.room) {
      qrValue += "&roomToken="+encodeURIComponent(this.state.room.token);
    }

    const baseStyles = {
      padding: "3px",
      backgroundColor: "#fff"
    };
    const position = this.state.position;
    const positionStyles = this.positions[position];

    let myStyles = { ...baseStyles, ...positionStyles };

    myStyles.opacity = this.props.opacity;
    myStyles.width = (this.props.size * 100) + "%";
    myStyles.height = "auto";

    return (
      <div className={styles.container} style={myStyles} >
        <div className={styles.inner}>
          <QRCode
            size={256}
            className={styles.qr}
            style={{ width: "100%", height: "auto" }}
            value={qrValue}
            viewBox={`0 0 256 256`}
          />
        </div>
      </div>
    )
  }


}

export default PlayerRemoteControlQR
