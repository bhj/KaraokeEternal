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

// Vertex shader for particle animation - enhanced with frequency mapping
const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float velocity;
  attribute float freqIntensity;

  varying vec3 vColor;
  varying float vVelocity;
  varying float vIntensity;

  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float beatIntensity;

  void main() {
    vColor = customColor;
    vVelocity = velocity;
    vIntensity = freqIntensity;

    vec3 pos = position;

    // Spiral motion based on velocity
    float angle = time * velocity * 0.5;
    float r = length(pos.xz);
    pos.x = cos(angle) * r;
    pos.z = sin(angle) * r;

    // Pulsing expansion with bass
    pos *= 1.0 + bass * 0.3;

    // Beat burst explosion - particles fly outward
    pos *= 1.0 + beatIntensity * 0.5;

    // Vertical wave with mid frequencies
    pos.y += sin(time * 2.0 + pos.x * 0.5) * mid * 0.5;

    // Each particle dances to its frequency
    pos.y += freqIntensity * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size modulation: base + bass pulse + frequency response
    float finalSize = size * (1.0 + bass * 2.0 + freqIntensity * 1.5);

    gl_PointSize = finalSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment shader for particles - enhanced for bloom
const fragmentShader = `
  varying vec3 vColor;
  varying float vVelocity;
  varying float vIntensity;

  uniform float treble;
  uniform float beatIntensity;

  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft glowing edge - brighter core for bloom pickup
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.3, dist);

    // Enhanced glow intensity based on treble and frequency intensity
    float glow = 0.8 + treble * 0.5 + vIntensity * 0.5;

    // Bright emission for bloom - particles glow based on their frequency
    vec3 color = vColor * glow;

    // Add bright core for bloom pickup
    color += vColor * core * 0.5;

    // Beat flash - bright burst
    color += vec3(beatIntensity * 0.4);

    gl_FragColor = vec4(color, alpha * 0.9);
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
    const freqIntensities = new Float32Array(PARTICLE_COUNT)

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

      // Initial frequency intensity (will be updated per frame)
      freqIntensities[i] = 0

      // Initial colors (will be updated)
      colors[i3] = 1
      colors[i3 + 1] = 1
      colors[i3 + 2] = 1
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('velocity', new THREE.BufferAttribute(vels, 1))
    geo.setAttribute('freqIntensity', new THREE.BufferAttribute(freqIntensities, 1))

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
        beatIntensity: { value: 0 },
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

    const { bass, mid, treble, frequencyData, isBeat, beatIntensity } = audioData.current

    // Update uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    material.uniforms.time.value = state.clock.elapsedTime

    material.uniforms.bass.value = bass

    material.uniforms.mid.value = mid

    material.uniforms.treble.value = treble

    material.uniforms.beatIntensity.value = beatIntensity

    // Update particle colors and frequency intensities based on audio and palette
    const colors = geometry.attributes.customColor as THREE.BufferAttribute
    const colorArray = colors.array as Float32Array
    const freqIntensities = geometry.attributes.freqIntensity as THREE.BufferAttribute
    const freqArray = freqIntensities.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Color based on position in frequency spectrum + randomness
      const freqIndex = Math.floor((i / PARTICLE_COUNT) * frequencyData.length)
      const intensity = frequencyData[freqIndex] ?? 0

      // Update per-particle frequency intensity for vertex shader
      // eslint-disable-next-line react-hooks/immutability -- Three.js buffer update
      freqArray[i] = intensity

      // Get color from palette based on frequency position
      const colorValue = (i / PARTICLE_COUNT) + treble * 0.2
      const color = getColorFromPalette(colorPalette, colorValue % 1)

      // Brighter base colors for bloom pickup

      colorArray[i3] = color.r * (0.7 + intensity * 0.5)
      colorArray[i3 + 1] = color.g * (0.7 + intensity * 0.5)
      colorArray[i3 + 2] = color.b * (0.7 + intensity * 0.5)
    }

    colors.needsUpdate = true
    freqIntensities.needsUpdate = true

    // Rotation based on audio
    points.rotation.y += 0.002 + bass * 0.01
    points.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1

    // Beat burst explosion - scale up dramatically on beat
    if (isBeat) {
      points.scale.setScalar(1.2 + beatIntensity * 0.3)
    } else {
      points.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08)
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
