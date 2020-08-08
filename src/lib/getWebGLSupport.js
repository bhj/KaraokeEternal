export default function isWebGLSupported () {
  try {
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl2')
  } catch (e) {
    return false
  }
}
