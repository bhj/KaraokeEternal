import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface ParticlesModeProps {
  colorPalette: ColorPalette
}

const PARTICLE_COUNT = 15000
const SPREAD = 8
const BASE_SIZE = 0.03

// Vertex shader for particle animation
const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float velocity;

  varying vec3 vColor;
  varying float vVelocity;

  uniform float time;
  uniform float bass;
  uniform float mid;

  void main() {
    vColor = customColor;
    vVelocity = velocity;

    vec3 pos = position;

    // Spiral motion based on velocity
    float angle = time * velocity * 0.5;
    float r = length(pos.xz);
    pos.x = cos(angle) * r;
    pos.z = sin(angle) * r;

    // Pulsing expansion with bass
    pos *= 1.0 + bass * 0.3;

    // Vertical wave with mid frequencies
    pos.y += sin(time * 2.0 + pos.x * 0.5) * mid * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size modulation: base + bass pulse
    float finalSize = size * (1.0 + bass * 2.0);

    gl_PointSize = finalSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment shader for particles
const fragmentShader = `
  varying vec3 vColor;
  varying float vVelocity;

  uniform float treble;

  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

    // Glow intensity based on treble
    float glow = 0.5 + treble * 0.5;

    // Color with glow
    vec3 color = vColor * glow;

    gl_FragColor = vec4(color, alpha * 0.8);
  }
`

// Simple seeded random for deterministic initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function ParticlesMode ({ colorPalette }: ParticlesModeProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { audioData } = useAudioData()

  // Create geometry with useMemo for stable reference
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const vels = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Spherical distribution with deterministic random
      const radius = seededRandom(i * 3) * SPREAD
      const theta = seededRandom(i * 3 + 1) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(i * 3 + 2) - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      // Random velocity for spiral motion
      vels[i] = (seededRandom(i * 3 + 3) - 0.5) * 2

      // Random sizes
      sizes[i] = BASE_SIZE + seededRandom(i * 3 + 4) * BASE_SIZE

      // Initial colors (will be updated)
      colors[i3] = 1
      colors[i3 + 1] = 1
      colors[i3 + 2] = 1
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('velocity', new THREE.BufferAttribute(vels, 1))

    return geo
  }, [])

  // Create material with useMemo for stable reference
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Animation loop

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return

    const { bass, mid, treble, frequencyData, isBeat } = audioData.current

    // Update uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    material.uniforms.time.value = state.clock.elapsedTime

    material.uniforms.bass.value = bass

    material.uniforms.mid.value = mid

    material.uniforms.treble.value = treble

    // Update particle colors based on audio and palette
    const colors = geometry.attributes.customColor as THREE.BufferAttribute
    const colorArray = colors.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Color based on position in frequency spectrum + randomness
      const freqIndex = Math.floor((i / PARTICLE_COUNT) * frequencyData.length)
      const intensity = frequencyData[freqIndex] ?? 0

      // Get color from palette based on frequency position
      const colorValue = (i / PARTICLE_COUNT) + treble * 0.2
      const color = getColorFromPalette(colorPalette, colorValue % 1)

      // Modulate by intensity
      // eslint-disable-next-line react-hooks/immutability -- Three.js buffer update
      colorArray[i3] = color.r * (0.5 + intensity * 0.5)
      colorArray[i3 + 1] = color.g * (0.5 + intensity * 0.5)
      colorArray[i3 + 2] = color.b * (0.5 + intensity * 0.5)
    }

    colors.needsUpdate = true

    // Rotation based on audio
    points.rotation.y += 0.002 + bass * 0.01
    points.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1

    // Pulse on beat
    if (isBeat) {
      points.scale.setScalar(1.1)
    } else {
      points.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      <ambientLight intensity={0.2} />
      <points ref={pointsRef} geometry={geometry} material={material} />
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default ParticlesMode
