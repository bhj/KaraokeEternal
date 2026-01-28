import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface ParticlesModeProps {
  colorPalette: ColorPalette
}

// Orbital ring configuration
const RING_CONFIG = [
  { particles: 3000, baseRadius: 1.5, spread: 0.3, baseSpeed: 1.2, sizeBase: 0.02 }, // Inner - fast, small
  { particles: 5000, baseRadius: 3.0, spread: 0.5, baseSpeed: 0.7, sizeBase: 0.03 }, // Middle - medium
  { particles: 4000, baseRadius: 5.0, spread: 0.8, baseSpeed: 0.4, sizeBase: 0.04 }, // Outer - slow, large
]
const TOTAL_PARTICLES = RING_CONFIG.reduce((sum, r) => sum + r.particles, 0)

// Comet burst particles
const COMET_COUNT = 500
const COMET_LIFETIME = 2.0 // seconds

// Vertex shader for orbital particles
const vertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float orbitRadius;
  attribute float orbitSpeed;
  attribute float orbitPhase;
  attribute float orbitInclination;
  attribute float freqIndex;

  varying vec3 vColor;
  varying float vIntensity;

  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float beatIntensity;
  uniform float energy;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform float chaosAmount;
  uniform float[64] frequencyData;

  void main() {
    vColor = customColor;

    // Get frequency intensity for this particle
    int idx = int(freqIndex * 63.0);
    float freqIntensity = frequencyData[idx];
    vIntensity = freqIntensity;

    // Base orbital position
    float angle = orbitPhase + time * orbitSpeed * (1.0 + energySmooth * 2.0);

    // Add chaos based on energy (metal = chaotic, ballad = ordered)
    float chaos = chaosAmount * energySmooth * spectralCentroid;
    angle += sin(time * 3.0 + orbitPhase * 10.0) * chaos * 0.5;

    // Calculate orbital position with inclination
    float r = orbitRadius * (1.0 + bass * 0.2);
    float x = cos(angle) * r;
    float z = sin(angle) * r;
    float y = sin(angle) * sin(orbitInclination) * r * 0.3;

    // Frequency-based vertical displacement
    y += freqIntensity * 0.8;

    // Beat burst - particles fly outward
    float burstMult = 1.0 + beatIntensity * 0.4;
    vec3 pos = vec3(x, y, z) * burstMult;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size: base + energy response + frequency response
    float energySize = 1.0 + energySmooth * 1.5;
    float freqSize = 1.0 + freqIntensity * 0.8;
    float finalSize = size * energySize * freqSize;

    gl_PointSize = finalSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

// Fragment shader for glowing particles
const fragmentShader = `
  varying vec3 vColor;
  varying float vIntensity;

  uniform float energySmooth;
  uniform float beatIntensity;
  uniform float spectralCentroid;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft glowing edge with bright core
    float alpha = 1.0 - smoothstep(0.15, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.25, dist);

    // Enhanced glow based on energy and frequency
    float glow = 0.7 + energySmooth * 0.6 + vIntensity * 0.4;

    vec3 color = vColor * glow;

    // Add hot core for bloom
    color += vColor * core * 0.6;

    // Beat flash
    color += vec3(beatIntensity * 0.3);

    // High energy = more saturated/bright
    color *= 1.0 + spectralCentroid * 0.3;

    gl_FragColor = vec4(color, alpha * 0.9);
  }
`

// Central star vertex shader
const starVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Central star fragment shader - pulsing emissive
const starFragmentShader = `
  uniform float time;
  uniform float bass;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform vec3 starColor;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel glow
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.0);

    // Pulsing intensity based on bass and energy
    float pulse = 0.5 + bass * 0.5 + sin(time * 2.0) * 0.1;
    float intensity = pulse * (0.5 + energySmooth * 1.5);

    // Color shifts with energy - cool for low, hot for high
    vec3 coolColor = starColor * vec3(0.5, 0.7, 1.0);
    vec3 hotColor = starColor * vec3(1.2, 0.9, 0.6);
    vec3 color = mix(coolColor, hotColor, spectralCentroid);

    // Core glow + fresnel rim
    vec3 finalColor = color * intensity + fresnel * color * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Comet trail vertex shader
const cometVertexShader = `
  attribute float size;
  attribute vec3 velocity;
  attribute float lifetime;
  attribute float startTime;

  varying float vAlpha;
  varying vec3 vColor;

  uniform float time;
  uniform vec3 cometColor;

  void main() {
    float age = time - startTime;
    float life = age / lifetime;

    if (life > 1.0 || life < 0.0) {
      gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vAlpha = 1.0 - life;
    vColor = cometColor;

    // Position based on velocity and time
    vec3 pos = position + velocity * age;

    // Trail fades and shrinks
    float finalSize = size * vAlpha;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = finalSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const cometFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
    gl_FragColor = vec4(vColor * 1.5, alpha);
  }
`

// Seeded random for deterministic initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function ParticlesMode ({ colorPalette }: ParticlesModeProps) {
  const orbitPointsRef = useRef<THREE.Points>(null)
  const centralStarRef = useRef<THREE.Mesh>(null)
  const cometPointsRef = useRef<THREE.Points>(null)
  const { audioData } = useAudioData()
  const cometBurstTimeRef = useRef<number>(0)

  // Create orbital particle geometry
  const orbitGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(TOTAL_PARTICLES * 3)
    const colors = new Float32Array(TOTAL_PARTICLES * 3)
    const sizes = new Float32Array(TOTAL_PARTICLES)
    const orbitRadii = new Float32Array(TOTAL_PARTICLES)
    const orbitSpeeds = new Float32Array(TOTAL_PARTICLES)
    const orbitPhases = new Float32Array(TOTAL_PARTICLES)
    const orbitInclinations = new Float32Array(TOTAL_PARTICLES)
    const freqIndices = new Float32Array(TOTAL_PARTICLES)

    let particleIndex = 0

    RING_CONFIG.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.particles; i++) {
        const idx = particleIndex * 3
        const seed = particleIndex * 7 + ringIndex * 1000

        // Random position within ring
        const radius = ring.baseRadius + (seededRandom(seed) - 0.5) * ring.spread * 2
        const phase = seededRandom(seed + 1) * Math.PI * 2
        const inclination = (seededRandom(seed + 2) - 0.5) * Math.PI * 0.4

        // Initial position on orbit
        positions[idx] = Math.cos(phase) * radius
        positions[idx + 1] = Math.sin(phase) * Math.sin(inclination) * radius * 0.3
        positions[idx + 2] = Math.sin(phase) * radius

        // Orbit parameters
        orbitRadii[particleIndex] = radius
        orbitSpeeds[particleIndex] = ring.baseSpeed * (0.8 + seededRandom(seed + 3) * 0.4)
        orbitPhases[particleIndex] = phase
        orbitInclinations[particleIndex] = inclination

        // Size with some variation
        sizes[particleIndex] = ring.sizeBase * (0.7 + seededRandom(seed + 4) * 0.6)

        // Frequency index for audio mapping
        freqIndices[particleIndex] = seededRandom(seed + 5)

        // Initial white color (will be updated per frame)
        colors[idx] = 1
        colors[idx + 1] = 1
        colors[idx + 2] = 1

        particleIndex++
      }
    })

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('orbitRadius', new THREE.BufferAttribute(orbitRadii, 1))
    geo.setAttribute('orbitSpeed', new THREE.BufferAttribute(orbitSpeeds, 1))
    geo.setAttribute('orbitPhase', new THREE.BufferAttribute(orbitPhases, 1))
    geo.setAttribute('orbitInclination', new THREE.BufferAttribute(orbitInclinations, 1))
    geo.setAttribute('freqIndex', new THREE.BufferAttribute(freqIndices, 1))

    return geo
  }, [])

  // Create orbital particle material
  const orbitMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        beatIntensity: { value: 0 },
        energy: { value: 0 },
        energySmooth: { value: 0 },
        spectralCentroid: { value: 0.5 },
        chaosAmount: { value: 1.0 },
        frequencyData: { value: new Float32Array(64) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Create central star material
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        energySmooth: { value: 0 },
        spectralCentroid: { value: 0.5 },
        starColor: { value: new THREE.Color(1, 1, 1) },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
    })
  }, [])

  // Create comet burst geometry
  const cometGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()

    const positions = new Float32Array(COMET_COUNT * 3)
    const velocities = new Float32Array(COMET_COUNT * 3)
    const sizes = new Float32Array(COMET_COUNT)
    const lifetimes = new Float32Array(COMET_COUNT)
    const startTimes = new Float32Array(COMET_COUNT)

    for (let i = 0; i < COMET_COUNT; i++) {
      // All start at origin, inactive
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
      sizes[i] = 0.05 + seededRandom(i * 11) * 0.05
      lifetimes[i] = COMET_LIFETIME
      startTimes[i] = -1000 // Inactive
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    geo.setAttribute('startTime', new THREE.BufferAttribute(startTimes, 1))

    return geo
  }, [])

  // Create comet material
  const cometMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        cometColor: { value: new THREE.Color(1, 0.8, 0.4) },
      },
      vertexShader: cometVertexShader,
      fragmentShader: cometFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Animation loop
  useFrame((state) => {
    const orbitPoints = orbitPointsRef.current
    const star = centralStarRef.current
    const cometPoints = cometPointsRef.current
    if (!orbitPoints || !star) return

    const {
      bass,
      mid,
      treble,
      frequencyData,
      isBeat,
      beatIntensity,
      energy,
      energySmooth,
      spectralCentroid,
    } = audioData.current
    const time = state.clock.elapsedTime

    // Update orbital particle uniforms
    orbitMaterial.uniforms.time.value = time
    orbitMaterial.uniforms.bass.value = bass
    orbitMaterial.uniforms.mid.value = mid
    orbitMaterial.uniforms.treble.value = treble
    orbitMaterial.uniforms.beatIntensity.value = beatIntensity
    orbitMaterial.uniforms.energy.value = energy
    orbitMaterial.uniforms.energySmooth.value = energySmooth
    orbitMaterial.uniforms.spectralCentroid.value = spectralCentroid
    orbitMaterial.uniforms.frequencyData.value = frequencyData

    // Update star uniforms
    starMaterial.uniforms.time.value = time
    starMaterial.uniforms.bass.value = bass
    starMaterial.uniforms.energySmooth.value = energySmooth
    starMaterial.uniforms.spectralCentroid.value = spectralCentroid

    // Update particle colors based on energy and palette
    const colors = orbitGeometry.attributes.customColor as THREE.BufferAttribute
    const colorArray = colors.array as Float32Array
    const freqIndices = orbitGeometry.attributes.freqIndex as THREE.BufferAttribute
    const freqIndexArray = freqIndices.array as Float32Array

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const i3 = i * 3
      const freqIdx = Math.floor(freqIndexArray[i] * frequencyData.length)
      const intensity = frequencyData[freqIdx] ?? 0

      // Color position: energy determines warmth, frequency determines position in palette
      // Low energy = cool blues/purples, high energy = hot oranges/whites
      const warmth = energySmooth * spectralCentroid
      const colorPos = (freqIndexArray[i] + treble * 0.2 + warmth * 0.3) % 1

      const baseColor = getColorFromPalette(colorPalette, colorPos)

      // Shift toward hot colors when energy is high
      const r = baseColor.r * (0.6 + intensity * 0.4 + warmth * 0.3)
      const g = baseColor.g * (0.6 + intensity * 0.3)
      const b = baseColor.b * (0.6 + intensity * 0.2 - warmth * 0.2)

      colorArray[i3] = Math.min(1.2, r)
      colorArray[i3 + 1] = Math.max(0.1, Math.min(1.0, g))
      colorArray[i3 + 2] = Math.max(0.1, Math.min(1.0, b))
    }
    colors.needsUpdate = true

    // Update star color based on energy
    const starBaseColor = getColorFromPalette(colorPalette, 0.5)
    starMaterial.uniforms.starColor.value = starBaseColor

    // Star scale pulses with bass
    const starScale = 0.3 + bass * 0.2 + energySmooth * 0.3
    star.scale.setScalar(starScale)

    // Trigger comet burst on beat
    if (isBeat && cometPoints && beatIntensity > 0.3 && time - cometBurstTimeRef.current > 0.3) {
      cometBurstTimeRef.current = time

      const positions = cometGeometry.attributes.position as THREE.BufferAttribute
      const velocities = cometGeometry.attributes.velocity as THREE.BufferAttribute
      const startTimes = cometGeometry.attributes.startTime as THREE.BufferAttribute
      const posArray = positions.array as Float32Array
      const velArray = velocities.array as Float32Array
      const startArray = startTimes.array as Float32Array

      // Spawn burst of comets
      const burstCount = Math.floor(50 + beatIntensity * 100)
      for (let i = 0; i < burstCount && i < COMET_COUNT; i++) {
        const idx = i * 3

        // Start from slightly randomized central position
        posArray[idx] = (Math.random() - 0.5) * 0.5
        posArray[idx + 1] = (Math.random() - 0.5) * 0.5
        posArray[idx + 2] = (Math.random() - 0.5) * 0.5

        // Random outward velocity - faster when high energy
        const speed = (2 + energySmooth * 4 + Math.random() * 2) * (1 + beatIntensity)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        velArray[idx] = Math.sin(phi) * Math.cos(theta) * speed
        velArray[idx + 1] = Math.sin(phi) * Math.sin(theta) * speed
        velArray[idx + 2] = Math.cos(phi) * speed

        startArray[i] = time
      }

      positions.needsUpdate = true
      velocities.needsUpdate = true
      startTimes.needsUpdate = true

      // Update comet color based on energy
      const cometColor = getColorFromPalette(colorPalette, 0.8 + energySmooth * 0.2)
      cometMaterial.uniforms.cometColor.value = cometColor
    }

    // Update comet time uniform
    if (cometPoints) {
      cometMaterial.uniforms.time.value = time
    }

    // Gentle whole-system rotation
    orbitPoints.rotation.y += 0.001 + energySmooth * 0.003
    orbitPoints.rotation.x = Math.sin(time * 0.3) * 0.1 * (1 - energySmooth * 0.5)
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      <ambientLight intensity={0.1} />

      {/* Central star */}
      <mesh ref={centralStarRef}>
        <icosahedronGeometry args={[1, 3]} />
        <primitive object={starMaterial} attach='material' />
      </mesh>

      {/* Orbital particles */}
      <points ref={orbitPointsRef} geometry={orbitGeometry} material={orbitMaterial} />

      {/* Comet bursts */}
      <points ref={cometPointsRef} geometry={cometGeometry} material={cometMaterial} />
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default ParticlesMode
