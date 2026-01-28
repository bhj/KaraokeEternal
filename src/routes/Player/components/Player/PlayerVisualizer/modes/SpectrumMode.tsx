import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface SpectrumModeProps {
  colorPalette: ColorPalette
}

const BAR_COUNT = 64
const RADIUS = 3
const BAR_WIDTH = 0.08
const BAR_DEPTH = 0.08
const MAX_HEIGHT = 2.5
const MIN_HEIGHT = 0.1

// Reusable objects for performance
const tempColor = new THREE.Color()
const tempMatrix = new THREE.Matrix4()
const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()

function SpectrumMode ({ colorPalette }: SpectrumModeProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { audioData } = useAudioData()

  // Store previous heights for smooth interpolation
  const prevHeights = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(MIN_HEIGHT))

  // Pre-calculate bar positions around the circle
  const barAngles = useMemo(() => {
    const angles: number[] = []
    for (let i = 0; i < BAR_COUNT; i++) {
      angles.push((i / BAR_COUNT) * Math.PI * 2)
    }
    return angles
  }, [])

  // Create geometry and material
  const geometry = useMemo(() => new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_DEPTH), [])
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0.5,
      }),
    [],
  )

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const { frequencyData, bass } = audioData.current

    // Map frequency bins to bars (frequencyData is 128 bins)
    const binStep = Math.floor(frequencyData.length / BAR_COUNT)

    for (let i = 0; i < BAR_COUNT; i++) {
      // Get frequency value for this bar
      const binIndex = Math.min(i * binStep, frequencyData.length - 1)
      const targetHeight = Math.max(MIN_HEIGHT, frequencyData[binIndex] * MAX_HEIGHT)

      // Smooth interpolation
      const height = THREE.MathUtils.lerp(prevHeights.current[i], targetHeight, 0.3)
      prevHeights.current[i] = height

      const angle = barAngles[i]

      // Position on circle, pointing outward
      tempPosition.set(Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS)

      // Rotate to face outward from center
      tempQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle + Math.PI / 2)

      // Scale: x is width, y is height (from frequency), z is depth
      tempScale.set(1, height, 1)

      // Offset y position so bar grows from bottom
      tempPosition.y = height / 2

      // Compose and apply matrix
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale)
      mesh.setMatrixAt(i, tempMatrix)

      // Color based on frequency band position and bass intensity
      const colorValue = (i / BAR_COUNT) * 0.7 + bass * 0.3
      getColorFromPalette(colorPalette, colorValue, tempColor)

      // Add emissive glow based on height
      mesh.setColorAt(i, tempColor)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }

    // Update material emissive based on bass
    // eslint-disable-next-line react-hooks/immutability -- Three.js material update
    material.emissiveIntensity = 0.3 + bass * 0.7
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 0]} intensity={1} color='#ffffff' />
      <pointLight position={[0, -5, 0]} intensity={0.5} color='#4488ff' />

      {/* Instanced bars */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, BAR_COUNT]}
        frustumCulled={false}
      />

      {/* Center glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={getColorFromPalette(colorPalette, 0.5)}
          emissive={getColorFromPalette(colorPalette, 0.5)}
          emissiveIntensity={1}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default SpectrumMode
