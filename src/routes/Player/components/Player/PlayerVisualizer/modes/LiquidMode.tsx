import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from 'shared/types'
import { useAudioData } from '../contexts/AudioDataContext'
import { getColorFromPalette } from '../utils/colorPalettes'

interface LiquidModeProps {
  colorPalette: ColorPalette
}

const BASE_RADIUS = 2.0
const SPHERE_DETAIL = 128 // High poly for smooth deformation

// Vertex shader for ferrofluid sphere deformation
const ferrofluidVertexShader = `
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float treble;
  uniform float energy;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform float beatIntensity;
  uniform float[64] frequencyData;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying float vFreqIntensity;

  // Simplex noise function for organic displacement
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
    vec3 pos = position;
    vec3 norm = normalize(normal);

    // Map vertex position to frequency bin (based on vertical angle)
    float vertAngle = acos(norm.y) / 3.14159; // 0 at top, 1 at bottom
    float horizAngle = atan(norm.z, norm.x) / 6.28318 + 0.5; // 0-1 around sphere

    // Get frequency for this vertex position
    int freqIndex = int(vertAngle * 63.0);
    float freqIntensity = frequencyData[freqIndex];
    vFreqIntensity = freqIntensity;

    // === DISPLACEMENT CALCULATION ===

    // 1. Base breathing with bass
    float breathing = 1.0 + bass * 0.15 + beatIntensity * 0.2;

    // 2. Frequency-driven spikes (ferrofluid effect)
    // Higher energy = more extreme spikes
    float spikeIntensity = freqIntensity * (0.3 + energySmooth * 0.7 + spectralCentroid * 0.5);

    // 3. Noise-based organic deformation
    float noiseScale = 2.0 + energySmooth * 3.0;
    float noiseSpeed = 0.5 + energySmooth * 1.5;
    float noise1 = snoise(norm * noiseScale + time * noiseSpeed) * 0.5 + 0.5;
    float noise2 = snoise(norm * noiseScale * 2.0 - time * noiseSpeed * 0.7) * 0.5 + 0.5;

    // Combine noises - more chaotic at high energy
    float organicNoise = mix(noise1, noise1 * noise2, energySmooth);

    // 4. Wave patterns for low energy (gentle ripples)
    float waveSpeed = 2.0 + mid * 2.0;
    float wave = sin(vertAngle * 8.0 + time * waveSpeed) * cos(horizAngle * 6.0 + time * waveSpeed * 0.7);
    float gentleWave = wave * 0.1 * (1.0 - energySmooth); // Fades out at high energy

    // 5. Ferrofluid spike formation
    // Spikes form at frequency peaks - sharper at high energy
    float spikeSharpness = 1.0 + spectralCentroid * 3.0;
    float spike = pow(freqIntensity, spikeSharpness) * (0.5 + energySmooth * 1.0);

    // Combine all displacement factors
    float totalDisplacement = 0.0;

    // Low energy: gentle organic waves
    totalDisplacement += gentleWave;
    totalDisplacement += organicNoise * 0.15 * (1.0 - energySmooth * 0.5);

    // High energy: aggressive spikes
    totalDisplacement += spike * 0.8;
    totalDisplacement += organicNoise * 0.3 * energySmooth;

    // Always some frequency response
    totalDisplacement += spikeIntensity * 0.4;

    // Beat burst - sudden expansion
    totalDisplacement += beatIntensity * 0.3;

    vDisplacement = totalDisplacement;

    // Apply displacement along normal
    pos = pos * breathing + norm * totalDisplacement;

    // Calculate displaced normal (approximation)
    vNormal = normalize(normalMatrix * norm);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Fragment shader for glossy ferrofluid material
const ferrofluidFragmentShader = `
  uniform float time;
  uniform float energySmooth;
  uniform float spectralCentroid;
  uniform float bass;
  uniform vec3 baseColor;
  uniform vec3 highlightColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDisplacement;
  varying float vFreqIntensity;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel effect for glossy rim
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);

    // Lighting
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 0.5));
    vec3 lightDir2 = normalize(vec3(-0.5, 0.5, -1.0));

    // Diffuse
    float diff1 = max(dot(normal, lightDir1), 0.0);
    float diff2 = max(dot(normal, lightDir2), 0.0) * 0.3;
    float diffuse = diff1 + diff2;

    // Specular (glossy highlights)
    vec3 reflectDir = reflect(-lightDir1, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0);

    // Color based on displacement and energy
    // Low energy = cool iridescent, High energy = hot molten
    vec3 coolColor = baseColor * vec3(0.7, 0.8, 1.0);
    vec3 hotColor = highlightColor * vec3(1.2, 0.8, 0.5);
    vec3 surfaceColor = mix(coolColor, hotColor, spectralCentroid);

    // Displacement affects color intensity
    float dispColorMix = vDisplacement * 0.5 + 0.5;
    surfaceColor = mix(surfaceColor * 0.7, surfaceColor * 1.3, dispColorMix);

    // Iridescent shift based on view angle (subtle)
    float iridescence = sin(fresnel * 6.28 + time) * 0.1 * (1.0 - energySmooth);
    surfaceColor.r += iridescence;
    surfaceColor.b -= iridescence;

    // Combine lighting
    vec3 ambient = surfaceColor * 0.2;
    vec3 diffuseColor = surfaceColor * diffuse * 0.6;
    vec3 specularColor = highlightColor * spec * (0.5 + energySmooth * 0.5);
    vec3 fresnelColor = highlightColor * fresnel * 0.4;

    vec3 finalColor = ambient + diffuseColor + specularColor + fresnelColor;

    // Emission for bloom - more at peaks
    float emission = vDisplacement * 0.3 + vFreqIntensity * 0.2 + bass * 0.1;
    finalColor += surfaceColor * emission;

    // High energy = more saturated and bright
    finalColor *= 1.0 + energySmooth * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Glass containment sphere shader - creates depth illusion
const glassVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const glassFragmentShader = `
  uniform float time;
  uniform float energySmooth;
  uniform vec3 glassColor;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Strong fresnel for glass edge effect
    float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 4.0);

    // Subtle refraction distortion look
    float edgeGlow = fresnel * (0.3 + energySmooth * 0.4);

    // Glass color with energy-reactive tint
    vec3 color = glassColor * edgeGlow;

    // Add subtle rainbow iridescence at edges
    float iridescence = sin(fresnel * 10.0 + time * 0.5);
    color.r += iridescence * 0.05 * fresnel;
    color.b -= iridescence * 0.05 * fresnel;

    // Very transparent except at edges
    float alpha = fresnel * 0.6;

    gl_FragColor = vec4(color, alpha);
  }
`

// Reactive light ring shader
const ringVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  uniform float time;
  uniform float bass;
  uniform float energySmooth;
  uniform float beatIntensity;
  uniform vec3 ringColor;
  uniform float[64] frequencyData;

  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    // Ring position angle
    float angle = atan(vPosition.z, vPosition.x) / 6.28318 + 0.5;

    // Map to frequency bin
    int freqIndex = int(angle * 63.0);
    float freqIntensity = frequencyData[freqIndex];

    // Pulsing glow based on frequency at this angle
    float glow = 0.3 + freqIntensity * 0.7 + bass * 0.3;

    // Beat flash
    glow += beatIntensity * 0.5;

    // Energy affects overall brightness
    glow *= 0.5 + energySmooth * 0.8;

    // Traveling wave effect
    float wave = sin(angle * 20.0 - time * 3.0) * 0.5 + 0.5;
    glow += wave * 0.2 * energySmooth;

    // Soft falloff from center of ring
    float dist = abs(vUv.y - 0.5) * 2.0;
    float ringFalloff = 1.0 - smoothstep(0.0, 1.0, dist);

    vec3 color = ringColor * glow * ringFalloff;

    // Add white hot spots on beats
    color += vec3(beatIntensity * freqIntensity * 0.5) * ringFalloff;

    float alpha = ringFalloff * (0.6 + glow * 0.4);

    gl_FragColor = vec4(color, alpha);
  }
`

function LiquidMode ({ colorPalette }: LiquidModeProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const glassRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { audioData } = useAudioData()

  // Create sphere geometry
  const sphereGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(BASE_RADIUS, SPHERE_DETAIL)
  }, [])

  // Create glass containment sphere geometry (slightly larger)
  const glassGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(BASE_RADIUS * 1.4, 32)
  }, [])

  // Create light ring geometry (torus around equator)
  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(BASE_RADIUS * 1.6, 0.08, 16, 100)
  }, [])

  // Create ferrofluid material
  const ferrofluidMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        mid: { value: 0 },
        treble: { value: 0 },
        energy: { value: 0 },
        energySmooth: { value: 0 },
        spectralCentroid: { value: 0.5 },
        beatIntensity: { value: 0 },
        frequencyData: { value: new Float32Array(64) },
        baseColor: { value: new THREE.Color(0.2, 0.4, 0.8) },
        highlightColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
      },
      vertexShader: ferrofluidVertexShader,
      fragmentShader: ferrofluidFragmentShader,
      side: THREE.DoubleSide,
    })
  }, [])

  // Create glass containment material
  const glassMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        energySmooth: { value: 0 },
        glassColor: { value: new THREE.Color(0.6, 0.8, 1.0) },
      },
      vertexShader: glassVertexShader,
      fragmentShader: glassFragmentShader,
      transparent: true,
      side: THREE.BackSide, // Render inside for containment effect
      depthWrite: false,
    })
  }, [])

  // Create light ring material
  const ringMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bass: { value: 0 },
        energySmooth: { value: 0 },
        beatIntensity: { value: 0 },
        ringColor: { value: new THREE.Color(0.5, 0.7, 1.0) },
        frequencyData: { value: new Float32Array(64) },
      },
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Animation loop
  useFrame((state) => {
    const sphere = sphereRef.current
    const glass = glassRef.current
    const ring = ringRef.current
    const group = groupRef.current
    if (!sphere || !group) return

    const {
      bass,
      mid,
      treble,
      frequencyData,
      beatIntensity,
      energy,
      energySmooth,
      spectralCentroid,
    } = audioData.current
    const time = state.clock.elapsedTime

    // Update ferrofluid shader uniforms
    // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
    ferrofluidMaterial.uniforms.time.value = time
    ferrofluidMaterial.uniforms.bass.value = bass
    ferrofluidMaterial.uniforms.mid.value = mid
    ferrofluidMaterial.uniforms.treble.value = treble
    ferrofluidMaterial.uniforms.energy.value = energy
    ferrofluidMaterial.uniforms.energySmooth.value = energySmooth
    ferrofluidMaterial.uniforms.spectralCentroid.value = spectralCentroid
    ferrofluidMaterial.uniforms.beatIntensity.value = beatIntensity
    ferrofluidMaterial.uniforms.frequencyData.value = frequencyData

    // Update colors from palette
    const baseColor = getColorFromPalette(colorPalette, 0.3)
    const highlightColor = getColorFromPalette(colorPalette, 0.7)
    const ringColor = getColorFromPalette(colorPalette, 0.5)
    ferrofluidMaterial.uniforms.baseColor.value = baseColor
    ferrofluidMaterial.uniforms.highlightColor.value = highlightColor

    // Update glass material uniforms
    if (glass) {
      // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
      glassMaterial.uniforms.time.value = time
      glassMaterial.uniforms.energySmooth.value = energySmooth
      glassMaterial.uniforms.glassColor.value = highlightColor
    }

    // Update ring material uniforms
    if (ring) {
      // eslint-disable-next-line react-hooks/immutability -- Three.js uniform updates
      ringMaterial.uniforms.time.value = time
      ringMaterial.uniforms.bass.value = bass
      ringMaterial.uniforms.energySmooth.value = energySmooth
      ringMaterial.uniforms.beatIntensity.value = beatIntensity
      ringMaterial.uniforms.ringColor.value = ringColor
      ringMaterial.uniforms.frequencyData.value = frequencyData

      // Ring pulses with beat
      const ringScale = 1.0 + beatIntensity * 0.1
      ring.scale.set(ringScale, ringScale, ringScale)
    }

    // Sphere rotation - slow when calm, fast when energetic
    const rotationSpeed = 0.002 + energySmooth * 0.015 + spectralCentroid * 0.01
    sphere.rotation.y += rotationSpeed
    sphere.rotation.x += rotationSpeed * 0.3

    // Slight wobble on beat
    if (beatIntensity > 0.3) {
      sphere.rotation.z += (Math.random() - 0.5) * beatIntensity * 0.1
    }

    // Group tumble - gentle continuous motion
    group.rotation.x = Math.sin(time * 0.2) * 0.1
    group.rotation.z = Math.cos(time * 0.15) * 0.1
  })

  return (
    <group ref={groupRef}>
      {/* eslint-disable react/no-unknown-property */}

      {/* Main ferrofluid sphere */}
      <mesh ref={sphereRef} geometry={sphereGeometry} material={ferrofluidMaterial} />

      {/* Glass containment sphere - creates depth illusion */}
      <mesh ref={glassRef} geometry={glassGeometry} material={glassMaterial} />

      {/* Reactive light ring around equator */}
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Second ring at different angle for more dimension */}
      <mesh
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[Math.PI / 2, 0, Math.PI / 4]}
        scale={[0.9, 0.9, 0.9]}
      />

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />

      {/* Key light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.0}
        color='#ffffff'
      />

      {/* Fill light */}
      <directionalLight
        position={[-3, 2, -5]}
        intensity={0.4}
        color='#8888ff'
      />

      {/* Rim light for dramatic edge */}
      <pointLight
        position={[0, -3, -3]}
        intensity={0.5}
        color='#ff8844'
      />
      {/* eslint-enable react/no-unknown-property */}
    </group>
  )
}

export default LiquidMode
