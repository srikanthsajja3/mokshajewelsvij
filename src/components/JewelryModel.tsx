import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface JewelryModelProps {
  type: string;
  imageUrl?: string;
}

// Pre-load the default ring model to prevent lag
const RING_MODEL_PATH = require('../../assets/models/ring_0.glb');

const RealRingModel: React.FC = () => {
  const { scene } = useGLTF(RING_MODEL_PATH) as any;
  
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

/**
 * Loads a dynamic GLB/glTF model from a URL or asset path.
 */
const RealGLBModel: React.FC<{ modelPath: string; type: string }> = ({ modelPath, type }) => {
  const { scene } = useGLTF(modelPath) as any;

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
  }, [scene, modelPath]);

  let scaleFactor = 0.5;
  if (type.toLowerCase().includes('necklace')) {
    scaleFactor = 1.0;
  } else if (type.toLowerCase().includes('earring')) {
    scaleFactor = 0.3;
  }

  return <primitive object={scene} scale={scaleFactor} />;
};

/**
 * Loads a 2D transparent product image and projects it as a billboard/sprite in 3D.
 * This provides photorealism when a full 3D model is not available.
 */
const RealImageModel: React.FC<{ imageUrl: string; type: string }> = ({ imageUrl, type }) => {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!imageUrl) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      imageUrl,
      (tex) => {
        // High quality filtering for jewelry details
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        setTexture(tex);
        setFailed(false);
      },
      undefined,
      (err) => {
        console.warn('[RealImageModel] Failed to load texture:', imageUrl, err);
        setFailed(true);
      }
    );
  }, [imageUrl]);

  if (failed || !imageUrl) {
    return <PlaceholderModel type={type} />;
  }

  if (!texture) {
    return <PlaceholderModel type={type} />;
  }

  // Adjust size of the billboard mesh to fit the product type
  let width = 2;
  let height = 2;

  if (type.toLowerCase().includes('necklace')) {
    width = 3.5;
    height = 3.5;
  } else if (type.toLowerCase().includes('earring')) {
    width = 0.8;
    height = 0.8;
  } else if (type.toLowerCase().includes('ring')) {
    width = 0.6;
    height = 0.6;
  }

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={texture} 
        transparent={true} 
        depthWrite={false} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
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
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.0, 0.05, 16, 100, Math.PI]} />
          {goldMaterial}
        </mesh>
        <mesh position={[0, -2.0, 0.1]}>
          <octahedronGeometry args={[0.4]} />
          {goldMaterial}
        </mesh>
      </group>
    );
  }

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

const JewelryModel: React.FC<JewelryModelProps> = ({ type, imageUrl }) => {
  const isRing = type.toLowerCase().includes('ring');

  if (isRing) {
    return (
      <Suspense fallback={<PlaceholderModel type={type} />}>
        <RealRingModel />
      </Suspense>
    );
  }

  if (imageUrl) {
    if (imageUrl.toLowerCase().endsWith('.glb') || imageUrl.toLowerCase().endsWith('.gltf')) {
      return (
        <Suspense fallback={<PlaceholderModel type={type} />}>
          <RealGLBModel modelPath={imageUrl} type={type} />
        </Suspense>
      );
    } else {
      return <RealImageModel imageUrl={imageUrl} type={type} />;
    }
  }

  return <PlaceholderModel type={type} />;
};

export default JewelryModel;
