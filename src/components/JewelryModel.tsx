import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface JewelryModelProps {
  type: string;
}

const JewelryModel: React.FC<JewelryModelProps> = ({ type }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  // Diamond / Stone Material - Simplified to Standard Material for troubleshooting
  const stoneMaterial = (
    <meshStandardMaterial
      color="#fff"
      metalness={0.9}
      roughness={0}
    />
  );

  // Rose Gold Material (Warm, Premium look)
  const roseGoldMaterial = (
    <meshStandardMaterial
      color="#E0BFB8"
      metalness={1}
      roughness={0.15}
      emissive="#2a1a1a"
      emissiveIntensity={0.1}
    />
  );

  // High-sparkle Diamond Material
  const diamondMaterial = (
    <meshStandardMaterial
      color="#ffffff"
      metalness={0.9}
      roughness={0.05}
      transparent
      opacity={0.9}
    />
  );

  // Gold Material (Bright, Classic)
  const goldMaterial = (
    <meshStandardMaterial
      color="#D4AF37"
      metalness={1}
      roughness={0.1}
      emissive="#1a1209"
      emissiveIntensity={0.05}
    />
  );

  if (type.toLowerCase().includes('ring')) {
    return (
      <group scale={[1.2, 1.2, 1.2]} rotation={[Math.PI / 2.5, 0, 0]}>
        {/* Slender Thin Band */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.04, 16, 100]} />
          {roseGoldMaterial}
        </mesh>

        {/* Floating Stone Bar */}
        <group position={[0, 0.52, 0]}>
          {/* Subtle horizontal bar support */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
            {roseGoldMaterial}
          </mesh>

          {/* 5 Rhythmic Diamonds */}
          {[-0.3, -0.15, 0, 0.15, 0.3].map((xPos, i) => (
            <mesh key={i} position={[xPos, 0.05, 0]} ref={i === 2 ? meshRef : null}>
              <octahedronGeometry args={[0.08]} />
              {diamondMaterial}
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  // Default Necklace/Pendant placeholder
  return (
    <group scale={[2, 2, 2]}>
      {/* Simple Pendant Shape */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.3]} />
        {stoneMaterial}
      </mesh>
      {/* Frame around it */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.4, 0.03, 16, 100]} />
        {goldMaterial}
      </mesh>
    </group>
  );
};

export default JewelryModel;
