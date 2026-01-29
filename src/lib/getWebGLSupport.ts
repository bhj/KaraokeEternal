export default function isWebGLSupported () {
  try {
    return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl')
  } catch {
    return false
  }
}
