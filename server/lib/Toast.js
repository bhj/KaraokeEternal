class Toast {
  /**
   * Sends a toast to a specific user or an array of users.
   * @param io The io object to use
   * @param userId The user ID or an array of user IDs
   * @param data The toast object data. Should contain at least a content property.
   */
  static sendToUser (io, userId, data) {
    if (Array.isArray(userId)) {
      for (const s of io.sockets.sockets.values()) {
        if (s.user && userId.includes(s.user.userId)) {
          s.emit('toast', data)
        }
      }
    } else {
      this.sendToUser(io, [userId], data)
    }
  }
}

module.exports = Toast
