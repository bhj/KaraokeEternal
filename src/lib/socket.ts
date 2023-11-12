import io from 'socket.io-client'

const socket = io({
  autoConnect: false,
  path: new URL(document.baseURI).pathname + 'socket.io',
})

export default socket
