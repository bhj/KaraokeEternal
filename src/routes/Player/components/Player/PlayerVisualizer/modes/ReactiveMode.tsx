import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette, COLOR_PALETTES } from '../utils/colorPalettes'

interface ReactiveModeProps {
  colorPalette: ColorPalette
}

const RING_COUNT = 3
const PARTICLE_COUNT = 200

// Reusable vectors
const tempVec = new THREE.Vector3()
const tempColor = new THREE.Color()

// Simple seeded random for deterministic initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function ReactiveMode ({ colorPalette }: ReactiveModeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringsRef = useRef<THREE.Mesh[]>([])
  const coreRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const { camera } = useThree()
  const { audioData } = useAudioData()

  // Store original camera position for shake
  const cameraBasePos = useRef(new THREE.Vector3(0, 0, 5))
  const cameraShake = useRef(new THREE.Vector3())

  // Create particle system with useMemo for deterministic results
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      // Random positions in a sphere using seeded random
      const radius = 3 + seededRandom(i * 3) * 4
      const theta = seededRandom(i * 3 + 1) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(i * 3 + 2) - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      colors[i3] = 1
      colors[i3 + 1] = 1
      colors[i3 + 2] = 1

      sizes[i] = 0.02 + seededRandom(i * 3 + 3) * 0.03
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [])

  const particleMaterial = useMemo(() =>
    new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }), [])

  // Ring materials
  const ringMaterials = useMemo(() =>
    Array(RING_COUNT).fill(null).map((_, i) =>
      new THREE.MeshStandardMaterial({
        color: COLOR_PALETTES[colorPalette][i % COLOR_PALETTES[colorPalette].length],
        emissive: COLOR_PALETTES[colorPalette][i % COLOR_PALETTES[colorPalette].length],
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
    ), [colorPalette])

  // Core material
  const coreMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color: COLOR_PALETTES[colorPalette][0],
      emissive: COLOR_PALETTES[colorPalette][0],
      emissiveIntensity: 1,
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.9,
    }), [colorPalette])

  useFrame((state) => {
    const { bass, mid, treble, isBeat, beatIntensity, frequencyData } = audioData.current
    const t = state.clock.elapsedTime

    // Camera shake on beat
    if (isBeat) {
      cameraShake.current.set(
        (seededRandom(t * 1000) - 0.5) * beatIntensity * 0.2,
        (seededRandom(t * 1000 + 1) - 0.5) * beatIntensity * 0.2,
        0,
      )
    } else {
      cameraShake.current.lerp(tempVec.set(0, 0, 0), 0.1)
    }
    camera.position.copy(cameraBasePos.current).add(cameraShake.current)

    // Animate rings
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return

      // Rotation based on audio bands
      const speed = 0.5 + (i === 0 ? bass : i === 1 ? mid : treble) * 2
      ring.rotation.x += 0.01 * speed * (i % 2 ? 1 : -1)
      ring.rotation.y += 0.005 * speed * (i % 2 ? -1 : 1)
      ring.rotation.z += 0.003 * speed

      // Scale pulse
      const scale = 1 + (i === 0 ? bass : i === 1 ? mid : treble) * 0.3
      ring.scale.setScalar(scale)

      // Update material color and emissive based on audio
      const material = ringMaterials[i]
      const colorValue = ((t * 0.1 + i * 0.33) % 1) + bass * 0.1
      getColorFromPalette(colorPalette, colorValue, tempColor)
      material.color.copy(tempColor)
      material.emissive.copy(tempColor)
      material.emissiveIntensity = 0.3 + (i === 0 ? bass : i === 1 ? mid : treble) * 0.7
    })

    // Animate core
    if (coreRef.current) {
      const coreScale = 0.8 + bass * 0.5
      coreRef.current.scale.setScalar(coreScale)
      coreRef.current.rotation.y += 0.02

      // eslint-disable-next-line react-hooks/immutability -- Three.js material update
      coreMaterial.emissiveIntensity = 0.5 + bass * 1.5
      const coreColorValue = (t * 0.05) % 1
      getColorFromPalette(colorPalette, coreColorValue, tempColor)
      coreMaterial.color.copy(tempColor)
      coreMaterial.emissive.copy(tempColor)
    }

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002 + bass * 0.01
      particlesRef.current.rotation.x += 0.001

      // Update particle colors
      const colors = particleGeometry.attributes.color as THREE.BufferAttribute
      const colorArray = colors.array as Float32Array

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        const freqIdx = Math.floor((i / PARTICLE_COUNT) * frequencyData.length)
        const intensity = frequencyData[freqIdx] ?? 0

        const colorValue = (i / PARTICLE_COUNT + t * 0.1) % 1
        getColorFromPalette(colorPalette, colorValue, tempColor)

        // eslint-disable-next-line react-hooks/immutability -- Three.js buffer update
        colorArray[i3] = tempColor.r * (0.3 + intensity * 0.7)
        colorArray[i3 + 1] = tempColor.g * (0.3 + intensity * 0.7)
        colorArray[i3 + 2] = tempColor.b * (0.3 + intensity * 0.7)
      }

      colors.needsUpdate = true

      // Scale particles with overall intensity
      const avgIntensity = (bass + mid + treble) / 3
      // eslint-disable-next-line react-hooks/immutability -- Three.js material update
      particleMaterial.size = 0.05 + avgIntensity * 0.05
    }

    // Rotate entire group
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003
    }
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color='#ffffff' />
      <pointLight position={[3, 3, 3]} intensity={0.5} color={COLOR_PALETTES[colorPalette][0]} />
      <pointLight position={[-3, -3, -3]} intensity={0.5} color={COLOR_PALETTES[colorPalette][1]} />

      <group ref={groupRef}>
        {/* Central core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.5, 2]} />
          <primitive object={coreMaterial} attach='material' />
        </mesh>

        {/* Reactive rings */}
        {Array(RING_COUNT).fill(null).map((_, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) ringsRef.current[i] = el }}
            rotation={[Math.PI / 2, 0, (i * Math.PI) / RING_COUNT]}
          >
            <torusGeometry args={[1.5 + i * 0.5, 0.05, 16, 64]} />
            <primitive object={ringMaterials[i]} attach='material' />
          </mesh>
        ))}

        {/* Ambient particles */}
        <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
      </group>
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default ReactiveMode
