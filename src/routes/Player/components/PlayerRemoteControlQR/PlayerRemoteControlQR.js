import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PlayerRemoteControlQR.css'
import QRCode from "react-qr-code";
import { fetchRoom } from 'store/modules/room'

import HttpApi from 'lib/HttpApi'
const api = new HttpApi('rooms')


const PlayerRemoteControlQR = props => {
  const [position, setPosition] = useState("bottomLeft");
  const [intervalId, setIntervalId] = useState(null);
  const user = useSelector(state => state.user)
  const room = useSelector(state => state.room.entity)

  const positions = {
    bottomLeft: {
      bottom: 16,
      left: 16,
    },
    bottomRight: {
      bottom: 16,
      right: 16,
    },
  };

  useEffect(() => {
    fetchRoom(user.roomId);
    maybeSetupInterval();
    
    return () => clearInterval(intervalId);
  }, []);


  const maybeSetupInterval = () => {
    // on mount, setup a interval to update the position of the QR code
    if (props.alternate && !intervalId) {
      setIntervalId(setInterval(() => {
        setPosition(prevPosition => prevPosition === "bottomLeft" ? "bottomRight" : "bottomLeft");
      }, 5 * 60 * 1000));
    } else if (!props.alternate && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }


  let qrValue = document.baseURI;
  qrValue += "?roomId=" + props.roomId;

  if (room) {
    qrValue += "&roomToken=" + encodeURIComponent(room.token);
  }

  const baseStyles = {
    padding: "3px",
    backgroundColor: "#fff"
  };
  const positionStyles = positions[position];

  let myStyles = { ...baseStyles, ...positionStyles };

  myStyles.opacity = props.opacity;
  myStyles.width = (props.size * 100) + "%";
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

PlayerRemoteControlQR.propTypes = {
  alternate: PropTypes.bool.isRequired,
  size: PropTypes.number.isRequired,
  opacity: PropTypes.number.isRequired,
  roomId: PropTypes.number.isRequired,
};

export default PlayerRemoteControlQR;