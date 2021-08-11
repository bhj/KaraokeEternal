const Media = require('./Media')
const {
  MEDIA_ADD,
  MEDIA_CLEANUP,
  MEDIA_REMOVE,
  MEDIA_UPDATE,
  YOUTUBE_VIDEO_UPDATE,
} = require('../../shared/actionTypes')

/**
 * IPC action handlers
 */
module.exports = function (io) {
  return {
    [MEDIA_ADD]: async ({ payload }) => Media.add(payload),
    [MEDIA_CLEANUP]: Media.cleanup,
    [MEDIA_REMOVE]: async ({ payload }) => Media.remove(payload),
    [MEDIA_UPDATE]: async ({ payload }) => Media.update(payload),
    [YOUTUBE_VIDEO_UPDATE]: async ({ payload }) => Media.updateYoutubeVideo(payload, io),
  }
}
