import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome5 } from '@expo/vector-icons';
import { Canvas } from '@react-three/fiber';
import { Product } from '../data/products';
import JewelryModel from '../components/JewelryModel';

// AI Tracking Imports
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

// Wrap CameraView with TFJS Tensor capabilities
const TensorCamera = cameraWithTensors(CameraView);

interface ARTryOnScreenProps {
  product: Product;
  onBack: () => void;
}

const ARTryOnScreen: React.FC<ARTryOnScreenProps> = ({ product, onBack }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  
  // Interactive State
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState(1);
  const [isTracking, setIsTracking] = useState(true);
  const [modelVisible, setModelVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing AI...');

  // Initialize AI Tracking
  useEffect(() => {
    async function initTracking() {
      try {
        console.log("ARTryOn: Initializing TFJS...");
        await tf.ready();
        
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
          runtime: 'tfjs', 
          modelType: 'lite',
          maxHands: 1
        };
        const handDetector = await handPoseDetection.createDetector(model, detectorConfig);
        detectorRef.current = handDetector;
        setIsDetectorReady(true);
        setDebugInfo('Searching...');
        console.log("ARTryOn: Detector Ready");
      } catch (err) {
        console.error("Tracking Init Error:", err);
        setDebugInfo('Init Error');
      }
    }

    initTracking();
  }, []);

  // Web Frame Processing Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !isDetectorReady) return;

    let frameId: number;
    let isProcessing = false;
    
    async function processFrame() {
      if (detectorRef.current && isTracking && !isProcessing) {
        isProcessing = true;
        try {
          const videos = document.querySelectorAll('video');
          const video = (videos.length > 0 ? videos[videos.length - 1] : null) as HTMLVideoElement;

          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            const imageTensor = tf.browser.fromPixels(video);
            const hands = await detectorRef.current.estimateHands(imageTensor, { flipHorizontal: true });
            imageTensor.dispose(); 

            if (hands && hands.length > 0) {
              const hand = hands[0];
              const score = Number((hand as any).score || 0.85);
              
              if (score > 0.4) {
                const keypoint = hand.keypoints.find(kp => kp.name === 'ring_finger_mcp') || hand.keypoints[9] || hand.keypoints[0];
                
                if (keypoint) {
                  const targetX = (keypoint.x / (video.videoWidth || 640)) * 10 - 5;
                  const targetY = -(keypoint.y / (video.videoHeight || 480)) * 10 + 5;
                  
                  setPosition([targetX, targetY, 0]);
                  setModelVisible(true);
                  setDebugInfo('HAND OK');
                }
              } else {
                setModelVisible(false);
                setDebugInfo('SEARCHING...');
              }
            } else {
              setModelVisible(false);
              setDebugInfo('SEARCHING...');
            }
          }
        } catch (err) {
          console.error("Web Processing Error:", err);
        }
        isProcessing = false;
      }
      frameId = requestAnimationFrame(processFrame);
    }

    processFrame();
    return () => cancelAnimationFrame(frameId);
  }, [isDetectorReady, isTracking]);

  // Native Stream Handler
  const handleCameraStream = (images: IterableIterator<tf.Tensor3D>, spec: any) => {
    console.log("ARTryOn: Native Stream Active");
    const loop = async () => {
      if (!isTracking || !detectorRef.current) {
        requestAnimationFrame(loop);
        return;
      }

      const imageTensor = images.next().value;
      if (!imageTensor) {
        requestAnimationFrame(loop);
        return;
      }

      try {
        const hands = await detectorRef.current.estimateHands(imageTensor, { flipHorizontal: false });

        if (hands && hands.length > 0) {
          const hand = hands[0];
          const score = Number((hand as any).score || 0.85);
          
          if (score > 0.25) {
            const keypoint = hand.keypoints.find(kp => kp.name === 'ring_finger_mcp') || hand.keypoints[9] || hand.keypoints[0];
            
            if (keypoint) {
              // Map from 200x152 tensor (standard tfjs-rn resize) to 3D space
              const targetX = (keypoint.x / 152) * 10 - 5;
              const targetY = -(keypoint.y / 200) * 10 + 5;
              
              setPosition(prev => [
                isNaN(prev[0]) ? targetX : prev[0] + (targetX - prev[0]) * 0.4,
                isNaN(prev[1]) ? targetY : prev[1] + (targetY - prev[1]) * 0.4,
                0
              ]);
              setModelVisible(true);
              setDebugInfo(`HAND OK (${(score * 100).toFixed(0)}%)`);
            }
          } else {
            setModelVisible(false);
            setDebugInfo(`LOW CONF (${(score * 100).toFixed(0)}%)`);
          }
        } else {
          setModelVisible(false);
          const spinners = ['|', '/', '-', '\\'];
          const tick = Math.floor(Date.now() / 200) % 4;
          setDebugInfo(`SEARCHING ${spinners[tick]}`);
        }
      } catch (err) {
        console.error("Native Proc Error:", err);
      } finally {
        tf.dispose(imageTensor);
      }

      requestAnimationFrame(loop);
    };

    loop();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => direction === 'in' ? prev * 1.1 : prev / 1.1);
  };

  const handleClose = () => {
    onBack();
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <CameraView 
          style={styles.camera} 
          facing="front" 
        />
      ) : (
        /* Only mount TensorCamera when detector is ready to ensure onReady fires */
        isDetectorReady && (
          <TensorCamera
            style={styles.camera}
            facing="front"
            cameraTextureHeight={1280}
            cameraTextureWidth={720}
            resizeHeight={200}
            resizeWidth={152}
            resizeDepth={3}
            onReady={handleCameraStream}
            autorender={true}
          />
        )
      )}
      
      {!isDetectorReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Initializing AI Tracking...</Text>
        </View>
      )}
      
      <View style={styles.canvasContainer} pointerEvents="none">
        <Canvas 
          orthographic 
          camera={{ left: -5, right: 5, top: 5, bottom: -5, near: 0.1, far: 100, position: [0, 0, 10] }}
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} />
          {modelVisible && (
            <group position={position} scale={[scale, scale, scale]}>
              <JewelryModel type={product.name} />
            </group>
          )}
        </Canvas>
      </View>

      <View style={styles.closeBtnContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
          <FontAwesome5 name="times" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.arContent} pointerEvents="none">
          <View style={styles.trackingStatus}>
            <View style={[styles.statusDot, { backgroundColor: modelVisible ? '#4CAF50' : '#FF5252' }]} />
            <Text style={styles.arHint}>
              {modelVisible ? "AI Auto-Alignment Active" : "Searching for Hand..."}
            </Text>
          </View>
          <Text style={styles.subHint}>Point camera at your hand</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlBtn, isTracking && styles.activeControl]} 
            onPress={() => setIsTracking(!isTracking)}
          >
            <FontAwesome5 name={isTracking ? "pause" : "play"} size={20} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom('in')}>
            <FontAwesome5 name="plus" size={20} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom('out')}>
            <FontAwesome5 name="minus" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer} pointerEvents="none">
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productInfo}>Auto-Alignment Beta</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1209',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 18, 9, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 20,
    fontFamily: 'TrajanPro',
    fontSize: 16,
    textAlign: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  canvasContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    padding: 20,
  },
  closeBtnContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10001,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  arContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  arHint: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 20,
  },
  controlBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  activeControl: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  footer: {
    backgroundColor: 'rgba(26, 18, 9, 0.9)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'TrajanPro',
    marginBottom: 5,
  },
  productInfo: {
    color: '#D4AF37',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  debugText: {
    color: '#FF5252',
    fontSize: 10,
    marginTop: 5,
    fontFamily: 'monospace',
  },
});

export default ARTryOnScreen;
