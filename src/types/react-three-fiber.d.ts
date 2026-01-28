// Extend JSX namespace with React Three Fiber elements
// This augments the global JSX namespace to include Three.js elements
import { ThreeElements } from '@react-three/fiber'

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Ensure this is treated as a module
export {}
