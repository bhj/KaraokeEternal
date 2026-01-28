import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette, COLOR_PALETTES } from '../utils/colorPalettes'

interface GeometryModeProps {
  colorPalette: ColorPalette
}

const DETAIL = 4 // Icosahedron subdivision level

// Vertex shader with frequency-based displacement
const vertexShader = `
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float frequencyData[64];

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
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
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
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
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normal;
    vPosition = position;

    // Calculate frequency index based on vertex position
    float angle = atan(position.y, position.x);
    float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
    int freqIndex = int(normalizedAngle * 63.0);

    // Get frequency value for this vertex region
    float freqValue = frequencyData[freqIndex];

    // Base noise displacement
    float noiseValue = snoise(position * 2.0 + vec3(time * 0.5));

    // Combine displacements
    float displacement = 0.0;
    displacement += noiseValue * 0.3 * mid;
    displacement += freqValue * 0.5;
    displacement += bass * 0.2;
    displacement += sin(time * 2.0 + length(position) * 4.0) * treble * 0.1;

    vDisplacement = displacement;

    // Apply displacement along normal
    vec3 newPosition = position + normal * displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

// Fragment shader with color palette
const fragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float time;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    // Fresnel effect for rim lighting
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);

    // Color mixing based on displacement and fresnel
    vec3 baseColor = mix(color1, color2, vDisplacement);
    baseColor = mix(baseColor, color3, fresnel * 0.5);

    // Add glow based on audio
    float glow = 0.5 + bass * 0.5;
    baseColor *= glow;

    // Emissive rim
    vec3 emissive = color3 * fresnel * (0.5 + treble * 0.5);

    gl_FragColor = vec4(baseColor + emissive, 1.0);
  }
`

function GeometryMode ({ colorPalette }: GeometryModeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { audioData } = useAudioData()

  // Create geometry with useMemo for stable reference
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, DETAIL), [])

  // Create material with useMemo for stable reference
  const material = useMemo(() => {
    const colors = COLOR_PALETTES[colorPalette]
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        frequencyData: { value: new Float32Array(64) },
        color1: { value: colors[0]?.clone() ?? new THREE.Color(0xff0000) },
        color2: { value: colors[1]?.clone() ?? new THREE.Color(0x00ff00) },
        color3: { value: colors[2]?.clone() ?? new THREE.Color(0x0000ff) },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    })
  }, [colorPalette])

  // Update material colors when palette changes
  useEffect(() => {
    const colors = COLOR_PALETTES[colorPalette]
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.color1.value = colors[0]?.clone() ?? new THREE.Color(0xff0000)

    material.uniforms.color2.value = colors[1]?.clone() ?? new THREE.Color(0x00ff00)

    material.uniforms.color3.value = colors[2]?.clone() ?? new THREE.Color(0x0000ff)
  }, [colorPalette, material])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const { bass, mid, treble, frequencyData } = audioData.current

    // Update uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    material.uniforms.time.value = state.clock.elapsedTime

    material.uniforms.bass.value = bass

    material.uniforms.mid.value = mid

    material.uniforms.treble.value = treble

    // Copy frequency data (take every other sample to get 64 values)
    const freqArray = material.uniforms.frequencyData.value as Float32Array
    for (let i = 0; i < 64; i++) {
      freqArray[i] = frequencyData[i * 2] ?? 0
    }

    // Rotation speed based on audio intensity
    const rotationSpeed = 0.005 + bass * 0.01
    mesh.rotation.x += rotationSpeed * 0.5
    mesh.rotation.y += rotationSpeed

    // Scale pulse with bass
    const scale = 1 + bass * 0.15
    mesh.scale.setScalar(scale)
  })

  return (
    <>
      {/* eslint-disable react/no-unknown-property */}
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color='#4488ff' />

      {/* Main geometry */}
      <mesh ref={meshRef} geometry={geometry} material={material} />

      {/* Wireframe overlay */}
      <mesh rotation={[0, 0, 0]}>
        <icosahedronGeometry args={[2.1, DETAIL]} />
        <meshBasicMaterial
          color={getColorFromPalette(colorPalette, 0.8)}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
      {/* eslint-enable react/no-unknown-property */}
    </>
  )
}

export default GeometryMode
