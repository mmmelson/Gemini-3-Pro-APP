
import React, { useRef, useMemo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, HandData, ShapeType } from '../types';
import { generatePositions } from '../utils/geometry';

interface ParticleSystemProps {
  config: ParticleConfig;
  handDataRef: MutableRefObject<HandData>;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ config, handDataRef }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create a circular texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)'); 
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)'); 
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  // Geometry Generation
  const { positions, randomPositions } = useMemo(() => {
    const pos = generatePositions(config.shape, config.count, config.textInput);
    const rand = generatePositions(ShapeType.RANDOM, config.count);
    return { positions: pos, randomPositions: rand };
  }, [config.shape, config.count, config.textInput]);

  // Initial Positions
  const initialPositions = useMemo(() => {
    const arr = new Float32Array(config.count * 3);
    for(let i=0; i<config.count; i++) {
         arr[i*3] = (Math.random() - 0.5) * 50;
         arr[i*3+1] = (Math.random() - 0.5) * 50;
         arr[i*3+2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, [config.count]);

  // Physics Loop
  useFrame(() => {
    if (!pointsRef.current) return;

    // Read directly from ref to avoid re-renders
    const handData = handDataRef.current;
    
    const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const count = config.count;
    const grip = handData.isPresent ? handData.gripStrength : 0;
    
    const lerpFactor = 0.08 * config.speed;
    const time = performance.now() * 0.001;

    // Matrices
    const transformationMatrix = new THREE.Matrix4();
    const rotationEuler = new THREE.Euler(
        THREE.MathUtils.degToRad(config.rotationOffsets.x),
        THREE.MathUtils.degToRad(config.rotationOffsets.y),
        THREE.MathUtils.degToRad(config.rotationOffsets.z) + (handData.isPresent ? handData.rotation.z : 0),
        'XYZ'
    );
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rotationEuler);
    const scaleFactor = handData.isPresent ? handData.scale : 1.0;
    const scaleMatrix = new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor);
    transformationMatrix.multiply(rotationMatrix).multiply(scaleMatrix);

    const offsetX = handData.isPresent ? handData.position.x * 20 : 0;
    const offsetY = handData.isPresent ? handData.position.y * 20 : 0;

    const tempVec = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      let tx, ty, tz;

      if (!handData.isPresent) {
         // --- IDLE MODE ---
         // Gentle floating sine wave
         tx = randomPositions[ix] + Math.sin(time + i * 0.1) * 2;
         ty = randomPositions[iy] + Math.cos(time + i * 0.1) * 2;
         tz = randomPositions[iz] + Math.sin(time * 0.5 + i * 0.05) * 2;
      } else {
         // --- INTERACTION MODE ---
         
         // 1. Calculate Shape Target (Fist closed)
         tempVec.set(positions[ix], positions[iy], positions[iz]);
         tempVec.applyMatrix4(transformationMatrix);
         const shapeX = tempVec.x + offsetX;
         const shapeY = tempVec.y + offsetY;
         const shapeZ = tempVec.z;

         // 2. Calculate Dispersed Target (Hand open)
         // Spread out random positions, but center them on the hand
         // "Tends to be static" -> No random noise added per frame
         const disperseScale = 1.5;
         const disperseX = randomPositions[ix] * disperseScale + offsetX;
         const disperseY = randomPositions[iy] * disperseScale + offsetY;
         const disperseZ = randomPositions[iz] * disperseScale;

         // 3. Interpolate based on Grip Strength
         // Grip 0 (Open) -> Dispersed
         // Grip 1 (Closed) -> Shape
         tx = THREE.MathUtils.lerp(disperseX, shapeX, grip);
         ty = THREE.MathUtils.lerp(disperseY, shapeY, grip);
         tz = THREE.MathUtils.lerp(disperseZ, shapeZ, grip);

         // 4. Add Life/Jitter
         // When open (grip 0): Very subtle breathing (Static feel)
         // When closed (grip 1): High energy vibration if wanted, or stable
         // Let's add a small constant life to keep it looking 3D
         const life = Math.sin(time * 2 + i) * 0.1;
         tx += life;
         ty += life;
         tz += life;
      }

      // Physics Integration
      currentPositions[ix] += (tx - currentPositions[ix]) * lerpFactor;
      currentPositions[iy] += (ty - currentPositions[iy]) * lerpFactor;
      currentPositions[iz] += (tz - currentPositions[iz]) * lerpFactor;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} key={config.count}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={config.count}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={particleTexture}
        size={config.size}
        color={config.color}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

export default ParticleSystem;
