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
const SPHERE_DETAIL = 32 // Reduced from 128 - still smooth, much fewer vertices

// Simplified vertex shader using sin waves instead of simplex noise
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
  varying float vDisplacement;
  varying float vFreqIntensity;

  void main() {
    vec3 pos = position;
    vec3 norm = normalize(normal);

    // Map vertex position to frequency bin
    float vertAngle = acos(norm.y) / 3.14159;
    float horizAngle = atan(norm.z, norm.x) / 6.28318 + 0.5;

    // Get frequency for this vertex position
    int freqIndex = int(vertAngle * 63.0);
    float freqIntensity = frequencyData[freqIndex];
    vFreqIntensity = freqIntensity;

    // === DISPLACEMENT CALCULATION (simplified) ===

    // 1. Base breathing with bass
    float breathing = 1.0 + bass * 0.15 + beatIntensity * 0.2;

    // 2. Frequency-driven spikes (ferrofluid effect)
    float spikeIntensity = freqIntensity * (0.3 + energySmooth * 0.7);

    // 3. Simple wave-based organic deformation (instead of noise)
    float wave1 = sin(norm.x * 8.0 + norm.y * 6.0 + time * (0.5 + energySmooth * 1.5));
    float wave2 = sin(norm.y * 10.0 - norm.z * 8.0 + time * 0.7);
    float wave3 = sin(norm.z * 7.0 + norm.x * 5.0 - time * 0.3);
    float organicWave = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);

    // 4. Gentle ripples for low energy
    float waveSpeed = 2.0 + mid * 2.0;
    float ripple = sin(vertAngle * 8.0 + time * waveSpeed) * cos(horizAngle * 6.0 + time * waveSpeed * 0.7);
    float gentleWave = ripple * 0.1 * (1.0 - energySmooth);

    // 5. Ferrofluid spike formation
    float spikeSharpness = 1.0 + spectralCentroid * 2.0;
    float spike = pow(max(freqIntensity, 0.0), spikeSharpness) * (0.4 + energySmooth * 0.8);

    // Combine all displacement factors
    float totalDisplacement = 0.0;

    // Low energy: gentle organic waves
    totalDisplacement += gentleWave;
    totalDisplacement += organicWave * 0.1 * (1.0 - energySmooth * 0.5);

    // High energy: aggressive spikes
    totalDisplacement += spike * 0.6;
    totalDisplacement += organicWave * 0.2 * energySmooth;

    // Always some frequency response
    totalDisplacement += spikeIntensity * 0.3;

    // Beat burst - sudden expansion
    totalDisplacement += beatIntensity * 0.25;

    vDisplacement = totalDisplacement;

    // Apply displacement along normal
    pos = pos * breathing + norm * totalDisplacement;

    // Calculate displaced normal
    vNormal = normalize(normalMatrix * norm);
    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;

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
    vec3 coolColor = baseColor * vec3(0.7, 0.8, 1.0);
    vec3 hotColor = highlightColor * vec3(1.2, 0.8, 0.5);
    vec3 surfaceColor = mix(coolColor, hotColor, spectralCentroid);

    // Displacement affects color intensity
    float dispColorMix = vDisplacement * 0.5 + 0.5;
    surfaceColor = mix(surfaceColor * 0.7, surfaceColor * 1.3, dispColorMix);

    // Subtle iridescence based on view angle
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

function LiquidMode ({ colorPalette }: LiquidModeProps) {
  const sphereRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { audioData } = useAudioData()

  // Create sphere geometry with reduced detail
  const sphereGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(BASE_RADIUS, SPHERE_DETAIL)
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

  // Animation loop
  useFrame((state) => {
    const sphere = sphereRef.current
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
    ferrofluidMaterial.uniforms.baseColor.value = baseColor
    ferrofluidMaterial.uniforms.highlightColor.value = highlightColor

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
