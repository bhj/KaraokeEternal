import io from 'socket.io-client'

const socket = io({
  autoConnect: false,
  path: new URL(document.baseURI).pathname + 'socket.io',
  reconnectionDelay: 1000, // start with 1s delay
  reconnectionDelayMax: 5000, // max 5s between attempts
  reconnectionAttempts: 10, // try 10 times before giving up
  transports: ['websocket', 'polling'], // match server config
})

export default socket
