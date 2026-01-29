import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useSmoothedAudio } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface ParticlesModeProps {
  colorPalette: ColorPalette
}

// Celestial particle configuration
const PARTICLE_COUNT = 16384 // 128 x 128
const TEXTURE_SIZE = 128

// GLSL Simplex noise implementation
const simplexNoiseGLSL = `
// Simplex 3D noise for curl calculation
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Curl noise - divergence-free velocity field
vec3 curlNoise(vec3 p, float scale, float time) {
  vec3 sp = p * scale + time;
  float eps = 0.001;

  // Partial derivatives via finite differences
  float n1, n2;

  // curl.x = dNz/dy - dNy/dz
  n1 = snoise(vec3(sp.x, sp.y + eps, sp.z));
  n2 = snoise(vec3(sp.x, sp.y - eps, sp.z));
  float dz_dy = (n1 - n2) / (2.0 * eps);

  n1 = snoise(vec3(sp.x, sp.y, sp.z + eps));
  n2 = snoise(vec3(sp.x, sp.y, sp.z - eps));
  float dy_dz = (n1 - n2) / (2.0 * eps);

  float curlX = dz_dy - dy_dz;

  // curl.y = dNx/dz - dNz/dx
  n1 = snoise(vec3(sp.x + eps, sp.y, sp.z));
  n2 = snoise(vec3(sp.x - eps, sp.y, sp.z));
  float dz_dx = (n1 - n2) / (2.0 * eps);

  n1 = snoise(vec3(sp.x, sp.y, sp.z + eps));
  n2 = snoise(vec3(sp.x, sp.y, sp.z - eps));
  float dx_dz = (n1 - n2) / (2.0 * eps);

  float curlY = dx_dz - dz_dx;

  // curl.z = dNy/dx - dNx/dy
  n1 = snoise(vec3(sp.x + eps, sp.y, sp.z));
  n2 = snoise(vec3(sp.x - eps, sp.y, sp.z));
  float dy_dx = (n1 - n2) / (2.0 * eps);

  n1 = snoise(vec3(sp.x, sp.y + eps, sp.z));
  n2 = snoise(vec3(sp.x, sp.y - eps, sp.z));
  float dx_dy = (n1 - n2) / (2.0 * eps);

  float curlZ = dy_dx - dx_dy;

  return vec3(curlX, curlY, curlZ);
}
`

// Simulation shader (updates position/velocity in fragment shader)
const simulationVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const simulationFragmentShader = `
  ${simplexNoiseGLSL}

  uniform sampler2D positionTexture;
  uniform sampler2D velocityTexture;
  uniform float time;
  uniform float deltaTime;
  uniform float energySmooth;
  uniform float bass;
  uniform float beatIntensity;
  uniform float spectralCentroid;
  uniform vec3 attractor1;
  uniform vec3 attractor2;
  uniform vec3 attractor3;

  varying vec2 vUv;

  void main() {
    vec4 posData = texture2D(positionTexture, vUv);
    vec4 velData = texture2D(velocityTexture, vUv);

    vec3 pos = posData.xyz;
    float life = posData.w;
    vec3 vel = velData.xyz;
    float seed = velData.w;

    // Curl noise parameters - energy affects scale and speed
    float noiseScale = 0.15 + energySmooth * 0.1;
    float noiseSpeed = 0.08 + energySmooth * 0.15 + spectralCentroid * 0.1;
    float noiseStrength = 0.3 + energySmooth * 0.5;

    // Get curl noise velocity (divergence-free = smooth swirling)
    vec3 curlVel = curlNoise(pos, noiseScale, time * noiseSpeed) * noiseStrength;

    // Soft attractor pull (not inverse-square, linear falloff)
    vec3 toAttractor1 = attractor1 - pos;
    vec3 toAttractor2 = attractor2 - pos;
    vec3 toAttractor3 = attractor3 - pos;

    float pullStrength = 0.02 + bass * 0.03;
    vec3 attractorPull = vec3(0.0);
    attractorPull += normalize(toAttractor1) * pullStrength * (1.0 - smoothstep(0.0, 5.0, length(toAttractor1)));
    attractorPull += normalize(toAttractor2) * pullStrength * (1.0 - smoothstep(0.0, 5.0, length(toAttractor2)));
    attractorPull += normalize(toAttractor3) * pullStrength * (1.0 - smoothstep(0.0, 5.0, length(toAttractor3)));

    // Beat burst - gentle outward push
    vec3 beatPush = vec3(0.0);
    if (beatIntensity > 0.3) {
      float dist = length(pos);
      if (dist > 0.1) {
        beatPush = normalize(pos) * beatIntensity * 0.15;
      }
    }

    // Combine velocities
    vel = vel * 0.98; // Gentle damping
    vel += curlVel * deltaTime;
    vel += attractorPull * deltaTime * 60.0;
    vel += beatPush;

    // Clamp velocity
    float maxSpeed = 0.3 + energySmooth * 0.2;
    float speed = length(vel);
    if (speed > maxSpeed) {
      vel = vel / speed * maxSpeed;
    }

    // Update position
    pos += vel * deltaTime * 60.0;

    // Soft boundary - pull back if too far
    float dist = length(pos);
    float maxDist = 8.0;
    if (dist > maxDist) {
      pos *= maxDist / dist;
      vel *= 0.5; // Slow down at boundary
    }

    // Update life (decreases over time)
    life -= deltaTime * (0.02 + seed * 0.03);

    // Respawn if dead
    if (life <= 0.0) {
      // Random respawn position near center
      float angle1 = seed * 6.28318 + time;
      float angle2 = fract(seed * 7.13 + time * 0.3) * 6.28318;
      float r = 1.0 + fract(seed * 3.14) * 2.0;

      pos.x = r * sin(angle1) * cos(angle2);
      pos.y = r * sin(angle1) * sin(angle2);
      pos.z = r * cos(angle1);

      vel = vec3(0.0);
      life = 0.8 + seed * 0.4; // Random lifespan
    }

    gl_FragColor = vec4(pos, life);
  }
`

// Render vertex shader - billboarded points with size from life
const renderVertexShader = `
  uniform sampler2D positionTexture;
  uniform float energySmooth;
  uniform float beatIntensity;

  attribute vec2 texCoord;
  attribute float baseSize;

  varying float vLife;
  varying float vSpeed;
  varying vec2 vTexCoord;

  void main() {
    vec4 posData = texture2D(positionTexture, texCoord);
    vec3 pos = posData.xyz;
    float life = posData.w;

    vLife = life;
    vTexCoord = texCoord;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size based on life (fade in/out) and energy
    float lifeFade = smoothstep(0.0, 0.2, life) * smoothstep(1.0, 0.7, life);
    float energySize = 1.0 + energySmooth * 0.6;
    float beatSize = 1.0 + beatIntensity * 0.3;
    float size = baseSize * lifeFade * energySize * beatSize;

    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Calculate speed for color (approximate from position change)
    vSpeed = length(pos) * 0.1;
  }
`

// Render fragment shader - soft glowing particles with nebula effect
const renderFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float energySmooth;
  uniform float beatIntensity;
  uniform float time;

  varying float vLife;
  varying float vSpeed;
  varying vec2 vTexCoord;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft radial falloff for nebula effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= alpha; // Squared for softer edges

    // Life-based fade
    float lifeFade = smoothstep(0.0, 0.2, vLife) * smoothstep(1.0, 0.6, vLife);
    alpha *= lifeFade;

    // Color gradient based on position in texture (variety)
    float colorMix = fract(vTexCoord.x * 3.0 + vTexCoord.y * 5.0 + time * 0.1);
    vec3 color = mix(color1, color2, smoothstep(0.0, 0.5, colorMix));
    color = mix(color, color3, smoothstep(0.5, 1.0, colorMix));

    // Brightness boost for high energy
    color *= 1.0 + energySmooth * 0.4;

    // Core glow
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    color += vec3(1.0) * core * 0.3;

    // Beat flash
    color += vec3(beatIntensity * 0.2);

    gl_FragColor = vec4(color, alpha * 0.7);
  }
`

// Seeded random for deterministic initialization
function seededRandom (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// GPU resources interface
interface GPUResources {
  positionTextureA: THREE.DataTexture
  positionTextureB: THREE.DataTexture
  velocityTexture: THREE.DataTexture
  renderTargetA: THREE.WebGLRenderTarget
  renderTargetB: THREE.WebGLRenderTarget
  simMaterial: THREE.ShaderMaterial
  renderMaterial: THREE.ShaderMaterial
  geometry: THREE.BufferGeometry
  simScene: THREE.Scene
  simCamera: THREE.OrthographicCamera
}

function ParticlesMode ({ colorPalette }: ParticlesModeProps) {
  const { gl } = useThree()
  const { getSmoothedAudio } = useSmoothedAudio({ lerpFactor: 0.3 }) // Snappy for particle response

  // Ping-pong state
  const pingPongRef = useRef<boolean>(true)
  const pointsRef = useRef<THREE.Points>(null)

  // Attractor positions (animated)
  const attractorsRef = useRef({
    a1: new THREE.Vector3(3, 0, 0),
    a2: new THREE.Vector3(-2, 2, 1),
    a3: new THREE.Vector3(0, -2, -2),
  })

  // Initialize GPU resources
  const gpuResources = useMemo<GPUResources>(() => {
    // Create position data texture (RGBA: xyz = position, w = life)
    const posData = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let i = 0; i < TEXTURE_SIZE * TEXTURE_SIZE; i++) {
      const i4 = i * 4
      const seed = i * 7

      // Random spherical distribution
      const r = 1 + seededRandom(seed) * 4
      const theta = seededRandom(seed + 1) * Math.PI * 2
      const phi = Math.acos(2 * seededRandom(seed + 2) - 1)

      posData[i4] = r * Math.sin(phi) * Math.cos(theta)
      posData[i4 + 1] = r * Math.sin(phi) * Math.sin(theta)
      posData[i4 + 2] = r * Math.cos(phi)
      posData[i4 + 3] = seededRandom(seed + 3) // life (staggered start)
    }

    const posTextureA = new THREE.DataTexture(
      posData,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    posTextureA.needsUpdate = true

    // Clone for ping-pong
    const posTextureB = posTextureA.clone()
    posTextureB.needsUpdate = true

    // Velocity texture (RGBA: xyz = velocity, w = seed for randomness)
    const velData = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let i = 0; i < TEXTURE_SIZE * TEXTURE_SIZE; i++) {
      const i4 = i * 4
      velData[i4] = 0 // vx
      velData[i4 + 1] = 0 // vy
      velData[i4 + 2] = 0 // vz
      velData[i4 + 3] = seededRandom(i * 11) // seed
    }

    const velTexture = new THREE.DataTexture(
      velData,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    velTexture.needsUpdate = true

    // Render targets for ping-pong
    const rtOptions = {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }

    const renderTargetA = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)
    const renderTargetB = new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, rtOptions)

    // Simulation material
    const simMat = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: posTextureA },
        velocityTexture: { value: velTexture },
        time: { value: 0 },
        deltaTime: { value: 0.016 },
        energySmooth: { value: 0 },
        bass: { value: 0 },
        beatIntensity: { value: 0 },
        spectralCentroid: { value: 0.5 },
        attractor1: { value: new THREE.Vector3(3, 0, 0) },
        attractor2: { value: new THREE.Vector3(-2, 2, 1) },
        attractor3: { value: new THREE.Vector3(0, -2, -2) },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
    })

    // Create render material
    const renderMat = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: posTextureA },
        color1: { value: new THREE.Color(1, 1, 1) },
        color2: { value: new THREE.Color(1, 1, 1) },
        color3: { value: new THREE.Color(1, 1, 1) },
        energySmooth: { value: 0 },
        beatIntensity: { value: 0 },
        time: { value: 0 },
      },
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create geometry for rendering particles
    const geo = new THREE.BufferGeometry()

    // Position placeholder (actual position comes from texture)
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Texture coordinates to sample position texture
    const texCoords = new Float32Array(PARTICLE_COUNT * 2)
    for (let i = 0; i < TEXTURE_SIZE; i++) {
      for (let j = 0; j < TEXTURE_SIZE; j++) {
        const idx = (i * TEXTURE_SIZE + j) * 2
        texCoords[idx] = (j + 0.5) / TEXTURE_SIZE
        texCoords[idx + 1] = (i + 0.5) / TEXTURE_SIZE
      }
    }
    geo.setAttribute('texCoord', new THREE.BufferAttribute(texCoords, 2))

    // Base sizes (variation)
    const sizes = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      sizes[i] = 1.5 + seededRandom(i * 13) * 1.5
    }
    geo.setAttribute('baseSize', new THREE.BufferAttribute(sizes, 1))

    // Simulation scene (for GPU computation)
    const simScn = new THREE.Scene()
    const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const simGeo = new THREE.PlaneGeometry(2, 2)
    const simMsh = new THREE.Mesh(simGeo, simMat)
    simScn.add(simMsh)

    return {
      positionTextureA: posTextureA,
      positionTextureB: posTextureB,
      velocityTexture: velTexture,
      renderTargetA,
      renderTargetB,
      simMaterial: simMat,
      renderMaterial: renderMat,
      geometry: geo,
      simScene: simScn,
      simCamera: simCam,
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      gpuResources.positionTextureA.dispose()
      gpuResources.positionTextureB.dispose()
      gpuResources.velocityTexture.dispose()
      gpuResources.renderTargetA.dispose()
      gpuResources.renderTargetB.dispose()
      gpuResources.geometry.dispose()
      gpuResources.simMaterial.dispose()
      gpuResources.renderMaterial.dispose()
    }
  }, [gpuResources])

  // Animation loop
  useFrame((state) => {
    const audio = getSmoothedAudio()
    const time = state.clock.elapsedTime
    const deltaTime = Math.min(state.clock.getDelta(), 0.05)

    // Update attractor positions (orbit based on audio)
    const a = attractorsRef.current
    const orbitSpeed = 0.2 + audio.energySmooth * 0.3
    a.a1.x = Math.cos(time * orbitSpeed) * (3 + audio.bass)
    a.a1.y = Math.sin(time * orbitSpeed * 0.7) * 1.5
    a.a1.z = Math.sin(time * orbitSpeed) * (2 + audio.mid)

    a.a2.x = Math.cos(time * orbitSpeed + 2.1) * 2.5
    a.a2.y = Math.sin(time * orbitSpeed * 0.5 + 1) * (2 + audio.treble)
    a.a2.z = Math.cos(time * orbitSpeed * 0.8 + 1) * 2

    a.a3.x = Math.sin(time * orbitSpeed * 0.6) * 2
    a.a3.y = Math.cos(time * orbitSpeed * 0.4) * -2
    a.a3.z = Math.sin(time * orbitSpeed + 3) * (2 + audio.energySmooth)

    const {
      positionTextureA,
      positionTextureB,
      velocityTexture,
      renderTargetA,
      renderTargetB,
      simMaterial,
      renderMaterial,
      simScene,
      simCamera,
    } = gpuResources

    // Update simulation uniforms
    const ping = pingPongRef.current
    const sourceTexture = ping
      ? renderTargetA.texture ?? positionTextureA
      : renderTargetB.texture ?? positionTextureB

    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    simMaterial.uniforms.positionTexture.value = sourceTexture
    simMaterial.uniforms.velocityTexture.value = velocityTexture
    simMaterial.uniforms.time.value = time
    simMaterial.uniforms.deltaTime.value = deltaTime
    simMaterial.uniforms.energySmooth.value = audio.energySmooth
    simMaterial.uniforms.bass.value = audio.bass
    simMaterial.uniforms.beatIntensity.value = audio.beatIntensity
    simMaterial.uniforms.spectralCentroid.value = audio.spectralCentroid
    simMaterial.uniforms.attractor1.value = a.a1
    simMaterial.uniforms.attractor2.value = a.a2
    simMaterial.uniforms.attractor3.value = a.a3

    // Render simulation to target
    const targetRT = ping ? renderTargetB : renderTargetA
    gl.setRenderTarget(targetRT)
    gl.render(simScene, simCamera)
    gl.setRenderTarget(null)

    // Update render material with new positions
    renderMaterial.uniforms.positionTexture.value = targetRT.texture
    renderMaterial.uniforms.energySmooth.value = audio.energySmooth
    renderMaterial.uniforms.beatIntensity.value = audio.beatIntensity
    renderMaterial.uniforms.time.value = time

    // Update colors from palette
    renderMaterial.uniforms.color1.value = getColorFromPalette(colorPalette, 0.2)
    renderMaterial.uniforms.color2.value = getColorFromPalette(colorPalette, 0.5)
    renderMaterial.uniforms.color3.value = getColorFromPalette(colorPalette, 0.8)

    // Flip ping-pong
    pingPongRef.current = !ping
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      <ambientLight intensity={0.1} />
      <points ref={pointsRef} geometry={gpuResources.geometry} material={gpuResources.renderMaterial} />
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default ParticlesMode
