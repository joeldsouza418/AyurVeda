import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// Points on the map, using brand colors
const STAGES = [
  { key: 'farm', label: 'Farmer', position: [-4, 0, 1], color: '#86B0B9' }, // brand-secondary
  { key: 'lab', label: 'Testing Lab', position: [-1, 0, -2], color: '#AE9E69' }, // brand-accent
  { key: 'retailer', label: 'Retailer', position: [2, 0, 0], color: '#367EA5' }, // brand-primary
  { key: 'consumer', label: 'Consumer', position: [4, 0, 2], color: '#5A6049' } // brand-dark
];

const TransportDrone = ({ position, rotation }) => {
  const group = useRef();
  
  // Rotating outer rings for dynamic aesthetic
  useFrame((state) => {
    if (group.current) {
      group.current.children[1].rotation.x += 0.03;
      group.current.children[1].rotation.y += 0.04;
      // hover effect
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.5;
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={0.6}>
      {/* Core glowing sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#E1E0C9" 
          emissive="#E1E0C9"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Outer glassy shell / rings */}
      <group>
        <mesh castShadow>
          <torusGeometry args={[0.8, 0.08, 16, 100]} />
          <meshPhysicalMaterial 
            color="#367EA5"
            metalness={0.9}
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.8, 0.08, 16, 100]} />
          <meshPhysicalMaterial 
            color="#86B0B9"
            metalness={0.9}
            roughness={0.1}
            transmission={0.9}
            thickness={0.5}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </group>

      {/* Base shadow disc */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

const AnimatedDrone = ({ onFinish }) => {
  const droneRef = useRef();
  const [currentSegment, setCurrentSegment] = useState(0);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (currentSegment >= STAGES.length - 1) {
      if (!droneRef.current.userData.finished) {
        droneRef.current.userData.finished = true;
        onFinish();
      }
      return;
    }

    const speed = 0.6; // units per second
    const startObj = STAGES[currentSegment];
    const endObj = STAGES[currentSegment + 1];

    const start = new THREE.Vector3(...startObj.position);
    const end = new THREE.Vector3(...endObj.position);

    const distance = start.distanceTo(end);
    
    // update progress based on delta
    const currentProg = progress + (delta * speed) / distance;
    
    if (currentProg >= 1) {
      setCurrentSegment(prev => prev + 1);
      setProgress(0);
    } else {
      setProgress(currentProg);
      // Interpolate position
      const currentPos = new THREE.Vector3().copy(start).lerp(end, currentProg);
      droneRef.current.position.copy(currentPos);
      
      // Look at destination
      droneRef.current.lookAt(end);
    }
  });

  return (
    <group ref={droneRef}>
      <TransportDrone position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </group>
  );
};

const MapPath = () => {
  const points = STAGES.map(s => new THREE.Vector3(...s.position));
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineDashedMaterial color="#367EA5" dashSize={0.2} gapSize={0.1} linewidth={2} />
    </line>
  );
};

const HeroScene = ({ onFinish }) => {
  return (
    <>
      <ambientLight intensity={0.6} color="#E1E0C9" />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" castShadow />
      <pointLight position={[0, 5, 0]} intensity={2} color="#86B0B9" />
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#E1E0C9" roughness={0.8} metalness={0.1} />
      </mesh>

      <MapPath />

      {/* Stage Nodes */}
      {STAGES.map((stage, idx) => (
        <group key={stage.key} position={stage.position}>
          {/* Base Platform */}
          <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.5, 0.6, 0.2, 32]} />
            <meshStandardMaterial color={stage.color} metalness={0.4} roughness={0.3} />
          </mesh>
          <Html position={[0, 0.8, 0]} center>
            <div className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg backdrop-blur-md bg-white/80 border`} style={{ borderColor: stage.color, color: stage.color }}>
              {stage.label}
            </div>
          </Html>
        </group>
      ))}

      <AnimatedDrone onFinish={onFinish} />
    </>
  );
};

export default function MapHero({ onAnimationComplete }) {
  return (
    <div className="w-full h-full relative z-0" style={{ background: 'linear-gradient(to bottom, #d6d5bf, #e1e0c9)' }}>
      <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
        <HeroScene onFinish={onAnimationComplete} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.2} autoRotate autoRotateSpeed={0.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
