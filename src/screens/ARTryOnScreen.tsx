import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome5 } from '@expo/vector-icons';
import { Canvas } from '@react-three/fiber';
import { Product } from '../data/products';
import JewelryModel from '../components/JewelryModel';

// AI Tracking Imports
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Wrap CameraView with TFJS Tensor capabilities
const TensorCamera = cameraWithTensors(CameraView);

import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

const ARTryOnScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ARTryOn'>>();
  const { product } = route.params;
  
  const jewelryType = (product.type || product.name || '').toLowerCase();
  const isHandJewelry = jewelryType.includes('ring') || jewelryType.includes('bracelet');
  const isFaceJewelry = jewelryType.includes('earring') || jewelryType.includes('necklace') || jewelryType.includes('pendant');

  const onBack = () => navigation.goBack();
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const handDetectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const faceDetectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  
  // Interactive State
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rightEarPos, setRightEarPos] = useState<[number, number, number] | null>(null);
  const [leftEarPos, setLeftEarPos] = useState<[number, number, number] | null>(null);
  const [scale, setScale] = useState(1);
  const [isTracking, setIsTracking] = useState(true);
  const [modelVisible, setModelVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing AI...');

  // Style State
  const [selectedStyle, setSelectedStyle] = useState<string>(product.name);

  const NECKLACE_OPTIONS = [
    { id: product.name, label: 'Original', type: 'necklace' },
    { id: 'necklace_traditional', label: 'Traditional', type: 'necklace' },
    { id: 'necklace_choker', label: 'Choker', type: 'necklace' },
    { id: 'necklace_pendant', label: 'Pendant', type: 'necklace' },
  ];

  const EARRING_OPTIONS = [
    { id: product.name, label: 'Original', type: 'earring' },
    { id: 'earring_drop', label: 'Drops', type: 'earring' },
    { id: 'earring_stud', label: 'Studs', type: 'earring' },
    { id: 'earring_hoop', label: 'Hoops', type: 'earring' },
  ];

  const currentOptions = isFaceJewelry ? (
    jewelryType.includes('necklace') ? NECKLACE_OPTIONS : EARRING_OPTIONS
  ) : [];

  // Initialize AI Tracking
  useEffect(() => {
    async function initTracking() {
      try {
        console.log("ARTryOn: Initializing TFJS...");
        await tf.ready();
        
        if (isHandJewelry) {
          const model = handPoseDetection.SupportedModels.MediaPipeHands;
          const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
            runtime: 'tfjs', 
            modelType: 'lite',
            maxHands: 1
          };
          handDetectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);
        } else if (isFaceJewelry) {
          const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
          const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
          };
          faceDetectorRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
        }

        setIsDetectorReady(true);
        setDebugInfo('Searching...');
        console.log("ARTryOn: Detector Ready");
      } catch (err) {
        console.error("Tracking Init Error:", err);
        setDebugInfo('Init Error');
      }
    }

    initTracking();
  }, [isHandJewelry, isFaceJewelry]);

  // Web Frame Processing Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !isDetectorReady) return;

    let frameId: number;
    let isProcessing = false;
    
    async function processFrame() {
      if (isTracking && !isProcessing) {
        isProcessing = true;
        try {
          const videos = document.querySelectorAll('video');
          const video = (videos.length > 0 ? videos[videos.length - 1] : null) as HTMLVideoElement;

          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            const imageTensor = tf.browser.fromPixels(video);
            
            if (isHandJewelry && handDetectorRef.current) {
              const hands = await handDetectorRef.current.estimateHands(imageTensor, { flipHorizontal: true });
              if (hands && hands.length > 0) {
                const keypoint = hands[0].keypoints.find(kp => kp.name === 'ring_finger_mcp') || hands[0].keypoints[9];
                if (keypoint) {
                  setPosition([(keypoint.x / video.videoWidth) * 10 - 5, -(keypoint.y / video.videoHeight) * 10 + 5, 0]);
                  setModelVisible(true);
                  setDebugInfo('HAND OK');
                }
              } else {
                setModelVisible(false);
              }
            } else if (isFaceJewelry && faceDetectorRef.current) {
              const faces = await faceDetectorRef.current.estimateFaces(imageTensor, { flipHorizontal: true });
              if (faces && faces.length > 0) {
                const face = faces[0];
                if (jewelryType.includes('necklace')) {
                  const chin = face.keypoints[152];
                  setPosition([(chin.x / video.videoWidth) * 10 - 5, -(chin.y / video.videoHeight) * 10 + 3.5, 0]);
                  setModelVisible(true);
                } else if (jewelryType.includes('earring')) {
                  const rEar = face.keypoints[234];
                  const lEar = face.keypoints[454];
                  setRightEarPos([(rEar.x / video.videoWidth) * 10 - 5, -(rEar.y / video.videoHeight) * 10 + 5, 0]);
                  setLeftEarPos([(lEar.x / video.videoWidth) * 10 - 5, -(lEar.y / video.videoHeight) * 10 + 5, 0]);
                  setModelVisible(true);
                }
                setDebugInfo('FACE OK');
              } else {
                setModelVisible(false);
              }
            }
            
            imageTensor.dispose(); 
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
  }, [isDetectorReady, isTracking, isHandJewelry, isFaceJewelry]);

  // Native Stream Handler
  const handleCameraStream = (images: IterableIterator<tf.Tensor3D>, spec: any) => {
    const loop = async () => {
      if (!isTracking) {
        requestAnimationFrame(loop);
        return;
      }

      const imageTensor = images.next().value;
      if (!imageTensor) {
        requestAnimationFrame(loop);
        return;
      }

      try {
        if (isHandJewelry && handDetectorRef.current) {
          const hands = await handDetectorRef.current.estimateHands(imageTensor, { flipHorizontal: false });
          if (hands && hands.length > 0) {
            const kp = hands[0].keypoints.find(k => k.name === 'ring_finger_mcp') || hands[0].keypoints[9];
            setPosition([(kp.x / 152) * 10 - 5, -(kp.y / 200) * 10 + 5, 0]);
            setModelVisible(true);
            setDebugInfo('HAND OK');
          } else {
            setModelVisible(false);
          }
        } else if (isFaceJewelry && faceDetectorRef.current) {
          const faces = await faceDetectorRef.current.estimateFaces(imageTensor, { flipHorizontal: false });
          if (faces && faces.length > 0) {
            const face = faces[0];
            if (jewelryType.includes('necklace')) {
              const chin = face.keypoints[152];
              setPosition([(chin.x / 152) * 10 - 5, -(chin.y / 200) * 10 + 3.5, 0]);
              setModelVisible(true);
            } else if (jewelryType.includes('earring')) {
              const rEar = face.keypoints[234];
              const lEar = face.keypoints[454];
              setRightEarPos([(rEar.x / 152) * 10 - 5, -(rEar.y / 200) * 10 + 5, 0]);
              setLeftEarPos([(lEar.x / 152) * 10 - 5, -(lEar.y / 200) * 10 + 5, 0]);
              setModelVisible(true);
            }
            setDebugInfo('FACE OK');
          } else {
            setModelVisible(false);
          }
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
            useCustomShadersToResize={false}
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
          
          {modelVisible && isHandJewelry && (
            <group position={position} scale={[scale, scale, scale]}>
              <JewelryModel type={selectedStyle} />
            </group>
          )}

          {modelVisible && jewelryType.includes('necklace') && (
            <group position={position} scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
              <JewelryModel type={selectedStyle} />
            </group>
          )}

          {modelVisible && jewelryType.includes('earring') && (
            <>
              {rightEarPos && (
                <group position={rightEarPos} scale={[scale * 0.4, scale * 0.4, scale * 0.4]}>
                  <JewelryModel type={selectedStyle} />
                </group>
              )}
              {leftEarPos && (
                <group position={leftEarPos} scale={[scale * 0.4, scale * 0.4, scale * 0.4]}>
                  <JewelryModel type={selectedStyle} />
                </group>
              )}
            </>
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
              {modelVisible ? "AI Auto-Alignment Active" : isHandJewelry ? "Searching for Hand..." : "Searching for Face..."}
            </Text>
          </View>
          <Text style={styles.subHint}>{isHandJewelry ? "Point camera at your hand" : "Point camera at your face"}</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>

        {currentOptions.length > 0 && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>SELECT STYLE</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.optionsScroll}
            >
              {currentOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt.id} 
                  style={[styles.optionItem, selectedStyle === opt.id && styles.activeOptionItem]}
                  onPress={() => setSelectedStyle(opt.id)}
                >
                  <Text style={[styles.optionLabel, selectedStyle === opt.id && styles.activeOptionLabel]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionsTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  optionsScroll: {
    gap: 10,
    paddingVertical: 5,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  activeOptionItem: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  optionLabel: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeOptionLabel: {
    color: '#000',
  },
});

export default ARTryOnScreen;
