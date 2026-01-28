import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface ParticlesModeProps {
  colorPalette: ColorPalette
}

// Gravitational system configuration
const ATTRACTOR_COUNT = 7 // Gravity wells
const PARTICLE_COUNT = 3000 // Small flowing particles

// Physics constants
const GRAVITY_STRENGTH = 0.8
const VELOCITY_DAMPING = 0.985
const MAX_VELOCITY = 0.5
const EXPLOSION_FORCE = 2.0

// Vertex shader for particles - receives pre-calculated positions
const vertexShader = `
  attribute float size;
  attribute vec3 customColor;

  varying vec3 vColor;

  uniform float energySmooth;
  uniform float beatIntensity;

  void main() {
    vColor = customColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size responds to energy
    float energySize = 1.0 + energySmooth * 0.8;
    float finalSize = size * energySize * (1.0 + beatIntensity * 0.3);

    gl_PointSize = finalSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment shader for glowing particles
const fragmentShader = `
  varying vec3 vColor;

  uniform float energySmooth;
  uniform float beatIntensity;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft glowing edge with bright core
    float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.2, dist);

    vec3 color = vColor * (0.8 + energySmooth * 0.4);

    // Add hot core for bloom
    color += vColor * core * 0.5;

    // Beat flash
    color += vec3(beatIntensity * 0.2);

    gl_FragColor = vec4(color, alpha * 0.85);
  }
`

// Attractor vertex shader
const attractorVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Attractor fragment shader - glowing orbs
const attractorFragmentShader = `
  uniform float time;
  uniform float bass;
  uniform float energySmooth;
  uniform vec3 attractorColor;
  uniform float intensity;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

    // Pulsing glow
    float pulse = 0.6 + bass * 0.4 + sin(time * 3.0) * 0.1;
    float glow = pulse * (0.5 + energySmooth * 1.0) * intensity;

    vec3 color = attractorColor * glow;
    color += attractorColor * fresnel * 0.6;

    gl_FragColor = vec4(color, 0.9);
  }
`

// Seeded random for deterministic initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Attractor state (position + velocity + properties)
interface Attractor {
  position: THREE.Vector3
  velocity: THREE.Vector3
  basePosition: THREE.Vector3
  mass: number
  freqBand: number // Which frequency band affects this attractor
}

function ParticlesMode ({ colorPalette }: ParticlesModeProps) {
  const particlePointsRef = useRef<THREE.Points>(null)
  const attractorMeshesRef = useRef<THREE.Mesh[]>([])
  const { audioData } = useAudioData()

  // Track last beat time for explosion cooldown
  const lastBeatTimeRef = useRef<number>(0)

  // Particle velocities (maintained separately from positions for physics)
  const velocitiesRef = useRef<Float32Array | null>(null)

  // Initialize attractors
  const attractors = useMemo<Attractor[]>(() => {
    const result: Attractor[] = []
    for (let i = 0; i < ATTRACTOR_COUNT; i++) {
      const angle = (i / ATTRACTOR_COUNT) * Math.PI * 2
      const radius = 3 + seededRandom(i * 13) * 2
      const y = (seededRandom(i * 17) - 0.5) * 3

      const basePos = new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius,
      )

      result.push({
        position: basePos.clone(),
        velocity: new THREE.Vector3(),
        basePosition: basePos,
        mass: 0.5 + seededRandom(i * 23) * 1.0,
        freqBand: i / ATTRACTOR_COUNT, // Each attractor responds to different frequency
      })
    }
    return result
  }, [])

  // Create particle geometry
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)

    // Initialize particle velocities
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    velocitiesRef.current = velocities

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const seed = i * 7

      // Spread particles in a sphere around the scene
      const r = 2 + seededRandom(seed) * 6
      const theta = seededRandom(seed + 1) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1)

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      // Small random initial velocity
      velocities[i3] = (seededRandom(seed + 3) - 0.5) * 0.02
      velocities[i3 + 1] = (seededRandom(seed + 4) - 0.5) * 0.02
      velocities[i3 + 2] = (seededRandom(seed + 5) - 0.5) * 0.02

      // Size variation
      sizes[i] = 0.03 + seededRandom(seed + 6) * 0.04

      // Initial white color (updated per frame)
      colors[i3] = 1
      colors[i3 + 1] = 1
      colors[i3 + 2] = 1
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geo
  }, [])

  // Create particle material
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        energySmooth: { value: 0 },
        beatIntensity: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Create attractor materials (one per attractor for individual colors)
  const attractorMaterials = useMemo(() => {
    return attractors.map(() =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          bass: { value: 0 },
          energySmooth: { value: 0 },
          attractorColor: { value: new THREE.Color(1, 1, 1) },
          intensity: { value: 1.0 },
        },
        vertexShader: attractorVertexShader,
        fragmentShader: attractorFragmentShader,
        transparent: true,
      }),
    )
  }, [attractors])

  // Animation loop - performs physics simulation
  useFrame((state) => {
    const particlePoints = particlePointsRef.current
    if (!particlePoints || !velocitiesRef.current) return

    const {
      bass,
      mid,
      treble,
      frequencyData,
      isBeat,
      beatIntensity,
      energySmooth,
      spectralCentroid,
    } = audioData.current
    const time = state.clock.elapsedTime
    const dt = Math.min(state.clock.getDelta(), 0.05) // Cap delta time

    // === UPDATE ATTRACTORS ===
    attractors.forEach((attractor, i) => {
      // Get frequency intensity for this attractor
      const freqIdx = Math.floor(attractor.freqBand * (frequencyData.length - 1))
      const freqIntensity = frequencyData[freqIdx] ?? 0

      // Attractors drift based on their frequency band
      const driftSpeed = 0.3 + freqIntensity * 0.5
      const driftAngle = time * driftSpeed + i * Math.PI * 0.5
      const driftRadius = 0.5 + mid * 1.5

      attractor.position.x = attractor.basePosition.x + Math.cos(driftAngle) * driftRadius
      attractor.position.y = attractor.basePosition.y + Math.sin(driftAngle * 0.7) * driftRadius * 0.5
      attractor.position.z = attractor.basePosition.z + Math.sin(driftAngle) * driftRadius

      // Update attractor mesh
      const mesh = attractorMeshesRef.current[i]
      if (mesh) {
        mesh.position.copy(attractor.position)

        // Scale with bass
        const scale = 0.15 + bass * 0.15 + freqIntensity * 0.1
        mesh.scale.setScalar(scale)

        // Update material
        const material = attractorMaterials[i]
        material.uniforms.time.value = time
        material.uniforms.bass.value = bass
        material.uniforms.energySmooth.value = energySmooth
        material.uniforms.intensity.value = 0.5 + freqIntensity * 1.0

        // Color from palette based on attractor position
        const color = getColorFromPalette(colorPalette, attractor.freqBand)
        material.uniforms.attractorColor.value = color
      }
    })

    // === PARTICLE PHYSICS ===
    const positions = particleGeometry.attributes.position as THREE.BufferAttribute
    const posArray = positions.array as Float32Array
    const velocities = velocitiesRef.current
    const colors = particleGeometry.attributes.customColor as THREE.BufferAttribute
    const colorArray = colors.array as Float32Array

    // Check for beat explosion
    const shouldExplode = isBeat && beatIntensity > 0.4 && time - lastBeatTimeRef.current > 0.2
    if (shouldExplode) {
      lastBeatTimeRef.current = time
    }

    // Gravity strength varies with energy
    const gravityMult = GRAVITY_STRENGTH * (0.5 + energySmooth * 1.0)

    // Process each particle
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Current position
      const px = posArray[i3]
      const py = posArray[i3 + 1]
      const pz = posArray[i3 + 2]

      // Accumulate acceleration from all attractors
      let ax = 0
      let ay = 0
      let az = 0

      for (const attractor of attractors) {
        const dx = attractor.position.x - px
        const dy = attractor.position.y - py
        const dz = attractor.position.z - pz

        const distSq = dx * dx + dy * dy + dz * dz
        const dist = Math.sqrt(distSq)

        // Avoid division by zero and extreme forces at close range
        const minDist = 0.5
        const effectiveDist = Math.max(dist, minDist)
        const effectiveDistSq = effectiveDist * effectiveDist

        // Gravitational acceleration: a = G * M / r^2
        const force = (gravityMult * attractor.mass) / effectiveDistSq

        // Direction toward attractor
        ax += (dx / dist) * force
        ay += (dy / dist) * force
        az += (dz / dist) * force
      }

      // Beat explosion - push outward from center
      if (shouldExplode) {
        const centerDist = Math.sqrt(px * px + py * py + pz * pz)
        const explosionStrength = EXPLOSION_FORCE * beatIntensity * (1 + energySmooth)
        if (centerDist > 0.1) {
          velocities[i3] += (px / centerDist) * explosionStrength
          velocities[i3 + 1] += (py / centerDist) * explosionStrength
          velocities[i3 + 2] += (pz / centerDist) * explosionStrength
        }
      }

      // Update velocity with acceleration
      velocities[i3] += ax * dt
      velocities[i3 + 1] += ay * dt
      velocities[i3 + 2] += az * dt

      // Apply velocity damping
      velocities[i3] *= VELOCITY_DAMPING
      velocities[i3 + 1] *= VELOCITY_DAMPING
      velocities[i3 + 2] *= VELOCITY_DAMPING

      // Clamp velocity
      const velMag = Math.sqrt(
        velocities[i3] ** 2 + velocities[i3 + 1] ** 2 + velocities[i3 + 2] ** 2,
      )
      if (velMag > MAX_VELOCITY) {
        const scale = MAX_VELOCITY / velMag
        velocities[i3] *= scale
        velocities[i3 + 1] *= scale
        velocities[i3 + 2] *= scale
      }

      // Update position
      // eslint-disable-next-line react-hooks/immutability -- Three.js buffer updates
      posArray[i3] += velocities[i3]
      posArray[i3 + 1] += velocities[i3 + 1]
      posArray[i3 + 2] += velocities[i3 + 2]

      // Soft boundary - push back if too far
      const posMag = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2)
      const maxRadius = 10
      if (posMag > maxRadius) {
        const pushBack = 0.1
        posArray[i3] -= (posArray[i3] / posMag) * pushBack
        posArray[i3 + 1] -= (posArray[i3 + 1] / posMag) * pushBack
        posArray[i3 + 2] -= (posArray[i3 + 2] / posMag) * pushBack
      }

      // Update color based on velocity (faster = brighter/warmer)
      const speedRatio = velMag / MAX_VELOCITY
      const colorPos = (i / PARTICLE_COUNT + treble * 0.2 + speedRatio * 0.3) % 1
      const baseColor = getColorFromPalette(colorPalette, colorPos)

      // Shift toward hot colors when moving fast
      colorArray[i3] = baseColor.r * (0.6 + speedRatio * 0.6)
      colorArray[i3 + 1] = baseColor.g * (0.6 + speedRatio * 0.3)
      colorArray[i3 + 2] = baseColor.b * (0.6 + speedRatio * 0.2 - spectralCentroid * 0.1)
    }

    positions.needsUpdate = true
    colors.needsUpdate = true

    // Update particle material uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    particleMaterial.uniforms.energySmooth.value = energySmooth
    particleMaterial.uniforms.beatIntensity.value = beatIntensity
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      <ambientLight intensity={0.1} />

      {/* Attractors (gravity wells) */}
      {attractors.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) attractorMeshesRef.current[i] = el
          }}
        >
          <icosahedronGeometry args={[1, 2]} />
          <primitive object={attractorMaterials[i]} attach='material' />
        </mesh>
      ))}

      {/* Particles */}
      <points ref={particlePointsRef} geometry={particleGeometry} material={particleMaterial} />
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default ParticlesMode
