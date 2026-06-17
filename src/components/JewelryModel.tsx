import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface JewelryModelProps {
  type: string;
}

// Pre-load the model to prevent lag during tracking
// On web, this will be a URL; on native, it uses the asset system
const RING_MODEL_PATH = require('../../assets/models/ring_0.glb');

const RealRingModel: React.FC = () => {
  const { scene } = useGLTF(RING_MODEL_PATH) as any;
  
  // Apply gold-like material properties to all meshes in the model
  // (Optional: if your GLB doesn't already have materials)
  React.useEffect(() => {
    scene.traverse((child: any) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).metalness = 1;
          (mesh.material as THREE.MeshStandardMaterial).roughness = 0.1;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={0.5} rotation={[Math.PI / 2, 0, 0]} />;
};

const PlaceholderModel: React.FC<{ type: string }> = ({ type }) => {
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 100]} />
        {goldMaterial}
      </mesh>
    );
  }

  if (type.toLowerCase().includes('earring')) {
    if (type.toLowerCase().includes('hoop')) {
      return (
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.2, 0.03, 16, 100]} />
          {goldMaterial}
        </mesh>
      );
    }
    if (type.toLowerCase().includes('stud')) {
      return (
        <mesh>
          <sphereGeometry args={[0.1, 32, 32]} />
          {goldMaterial}
        </mesh>
      );
    }
    // Default Drop Earring
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          {goldMaterial}
        </mesh>
        <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.1, 0.4, 32]} />
          {goldMaterial}
        </mesh>
      </group>
    );
  }

  if (type.toLowerCase().includes('necklace')) {
    if (type.toLowerCase().includes('choker')) {
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.1, 16, 100, Math.PI]} />
          {goldMaterial}
        </mesh>
      );
    }
    if (type.toLowerCase().includes('pendant')) {
      return (
        <group rotation={[0.2, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.0, 0.02, 16, 100, Math.PI]} />
            {goldMaterial}
          </mesh>
          <mesh position={[0, -2.0, 0.1]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            {goldMaterial}
          </mesh>
        </group>
      );
    }
    // Default Traditional Necklace
    return (
      <group rotation={[0.2, 0, 0]}>
        {/* Main Chain Curve */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.0, 0.05, 16, 100, Math.PI]} />
          {goldMaterial}
        </mesh>
        {/* Center Pendant */}
        <mesh position={[0, -2.0, 0.1]}>
          <octahedronGeometry args={[0.4]} />
          {goldMaterial}
        </mesh>
      </group>
    );
  }

  // Generic Pendant/Other placeholder
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        {goldMaterial}
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.4, 0.03, 16, 100]} />
        {goldMaterial}
      </mesh>
    </group>
  );
};

const JewelryModel: React.FC<JewelryModelProps> = ({ type }) => {
  const isRing = type.toLowerCase().includes('ring');

  if (isRing) {
    return (
      <Suspense fallback={<PlaceholderModel type={type} />}>
        <RealRingModel />
      </Suspense>
    );
  }

  return <PlaceholderModel type={type} />;
};

export default JewelryModel;
