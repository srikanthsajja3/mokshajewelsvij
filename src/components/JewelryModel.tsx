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
  const { scene } = useGLTF(RING_MODEL_PATH);
  
  // Apply gold-like material properties to all meshes in the model
  // (Optional: if your GLB doesn't already have materials)
  React.useEffect(() => {
    scene.traverse((child) => {
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

  // Pendant/Necklace placeholder
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
