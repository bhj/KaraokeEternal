import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky, Cloud, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface LiquidModeProps {
  colorPalette: ColorPalette
}

const COLUMN_COUNT = 64
const COLUMN_SPREAD = 12
const MAX_HEIGHT = 4

// Vertex shader for oobleck columns
const columnVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vHeight = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader for glossy oobleck material
const columnFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float bass;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    // Fresnel effect for glossy look
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

    // Base color with height gradient
    vec3 baseColor = color * (0.6 + vHeight * 0.2);

    // Glossy highlight
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
    float specular = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);

    // Combine with fresnel rim
    vec3 finalColor = baseColor + fresnel * 0.3 + specular * 0.5;

    // Emission for bloom pickup - brighter at peaks
    finalColor *= 1.0 + bass * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Simple seeded random for deterministic column positions
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function LiquidMode ({ colorPalette }: LiquidModeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const columnsRef = useRef<THREE.InstancedMesh>(null)
  const cloudRef = useRef<THREE.Group>(null)
  const { audioData } = useAudioData()
  const { camera } = useThree()

  // Store column data
  const columnData = useMemo(() => {
    const positions: [number, number, number][] = []
    const baseHeights: number[] = []

    for (let i = 0; i < COLUMN_COUNT; i++) {
      const angle = (i / COLUMN_COUNT) * Math.PI * 2
      const radius = 2 + seededRandom(i * 7) * COLUMN_SPREAD
      positions.push([
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ])
      baseHeights.push(0.3 + seededRandom(i * 13) * 0.5)
    }

    return { positions, baseHeights }
  }, [])

  // Create column material
  const columnMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x4488ff) },
        time: { value: 0 },
        bass: { value: 0 },
      },
      vertexShader: columnVertexShader,
      fragmentShader: columnFragmentShader,
    })
  }, [])

  // Create column geometry - cylinder for oobleck look
  const columnGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.15, 0.25, 1, 16)
  }, [])

  // Set up isometric-style camera
  useMemo(() => {
    camera.position.set(8, 8, 8)
    camera.lookAt(0, 0, 0)
  }, [camera])

  // Animation loop
  useFrame((state) => {
    const columns = columnsRef.current
    if (!columns) return

    const { bass, mid, treble, frequencyData, isBeat, beatIntensity } = audioData.current
    const time = state.clock.elapsedTime

    // Update material uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    columnMaterial.uniforms.time.value = time
    columnMaterial.uniforms.bass.value = bass

    // Update color based on palette
    const color = getColorFromPalette(colorPalette, (Math.sin(time * 0.2) + 1) * 0.5)
    columnMaterial.uniforms.color.value = color

    // Update each column instance
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()

    for (let i = 0; i < COLUMN_COUNT; i++) {
      const [x, , z] = columnData.positions[i]
      const baseHeight = columnData.baseHeights[i]

      // Map column to frequency bin
      const freqIndex = Math.floor((i / COLUMN_COUNT) * frequencyData.length)
      const intensity = frequencyData[freqIndex] ?? 0

      // Calculate height based on audio
      let height = baseHeight + intensity * MAX_HEIGHT
      height += bass * 0.5

      // Beat burst - columns erupt
      if (isBeat) {
        height += beatIntensity * 2
      }

      // Add subtle wave motion
      height += Math.sin(time * 2 + i * 0.3) * 0.1 * mid

      // Clamp height
      height = Math.max(0.1, Math.min(height, MAX_HEIGHT * 1.5))

      position.set(x, height / 2, z)
      scale.set(1 + treble * 0.3, height, 1 + treble * 0.3)

      matrix.compose(position, quaternion, scale)
      columns.setMatrixAt(i, matrix)
    }

    columns.instanceMatrix.needsUpdate = true

    // Rotate cloud layer based on treble
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.001 + treble * 0.005
    }

    // Subtle group rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005 + bass * 0.002
    }
  })

  return (
    <group ref={groupRef}>
      {/* Dynamic sky */}
      {/* eslint-disable react/no-unknown-property */}
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={2}
        turbidity={10}
      />

      {/* Rolling clouds */}
      <group ref={cloudRef} position={[0, 10, 0]}>
        <Cloud
          opacity={0.5}
          speed={0.4}
          width={20}
          depth={5}
          segments={20}
        />
        <Cloud
          position={[10, 0, -5]}
          opacity={0.3}
          speed={0.3}
          width={15}
          depth={3}
          segments={15}
        />
      </group>

      {/* Reflective water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={50}
          roughness={0.7}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color='#050505'
          metalness={0.8}
          mirror={0.5}
        />
      </mesh>

      {/* Oobleck columns */}
      <instancedMesh
        ref={columnsRef}
        args={[columnGeometry, columnMaterial, COLUMN_COUNT]}
        castShadow
        receiveShadow
      />

      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
      />
      <pointLight position={[0, 5, 0]} intensity={0.5} color='#4488ff' />
      {/* eslint-enable react/no-unknown-property */}
    </group>
  )
}

export default LiquidMode
