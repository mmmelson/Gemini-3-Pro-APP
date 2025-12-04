
import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ParticleSystem from './components/ParticleSystem';
import HandTracker from './components/HandTracker';
import Controls from './components/Controls';
import { HandData, ParticleConfig, ShapeType } from './types';

const App: React.FC = () => {
  // Use Ref for high-frequency hand data to avoid re-rendering React components 60fps
  // This fixes the flickering issue caused by constant geometry regeneration
  const handDataRef = useRef<HandData>({
    isPresent: false,
    gripStrength: 0,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    pinchDistance: 1,
    scale: 1
  });

  // Ref for the UI indicator to update it without react renders
  const indicatorRef = useRef<HTMLDivElement>(null);

  const defaultConfig: ParticleConfig = {
    count: 8000,
    size: 0.2,
    speed: 1.0,
    color: '#3b82f6',
    shape: ShapeType.RANDOM, 
    textInput: 'MAGIC',
    rotationOffsets: { x: 0, y: 0, z: 0 }
  };

  const [config, setConfig] = useState<ParticleConfig>(defaultConfig);
  const [showCamera, setShowCamera] = useState(true);

  const resetConfig = () => setConfig(defaultConfig);

  // High-frequency callback from HandTracker
  const handleHandUpdate = (data: HandData) => {
    // Update physics ref
    handDataRef.current = data;

    // Direct DOM manipulation for UI feedback (bypassing React render cycle)
    if (indicatorRef.current) {
      if (data.isPresent) {
        indicatorRef.current.style.display = 'block';
        indicatorRef.current.style.opacity = Math.max(0.2, data.gripStrength).toString();
        // Optional: Scale the indicator based on grip to show "pressure"
        const scale = 1 + data.gripStrength * 0.5;
        indicatorRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      } else {
        indicatorRef.current.style.display = 'none';
      }
    }
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 35], fov: 60 }} dpr={[1, 2]}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          {/* Pass the Ref, not the State */}
          <ParticleSystem config={config} handDataRef={handDataRef} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={false} 
            maxDistance={60}
            minDistance={10}
            enableRotate={false}
          />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <Controls 
        config={config} 
        setConfig={setConfig} 
        showCamera={showCamera}
        setShowCamera={setShowCamera}
        reset={resetConfig}
      />

      {/* Hand Tracking Logic */}
      <HandTracker onHandUpdate={handleHandUpdate} showCamera={showCamera} />

      {/* Interaction Indicator (Managed via Ref) */}
      <div 
        ref={indicatorRef}
        className="absolute top-1/2 left-1/2 pointer-events-none transition-transform duration-75 ease-out"
        style={{ display: 'none' }}
      >
         <div className="w-24 h-24 border-2 border-blue-500/50 rounded-full animate-ping" />
         <div className="absolute inset-0 w-24 h-24 border border-white/20 rounded-full" />
      </div>
    </div>
  );
};

export default App;
