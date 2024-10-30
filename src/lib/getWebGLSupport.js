export default function isWebGLSupported () {
  try {
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl2') && !(env.KES_PLAYER_DISABLE_WEBGL)
  } catch (e) {
    return false
  }
}
