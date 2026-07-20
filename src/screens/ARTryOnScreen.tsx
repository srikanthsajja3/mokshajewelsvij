import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ActivityIndicator, Dimensions, ScrollView, TextInput, KeyboardAvoidingView, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome5 } from '@expo/vector-icons';
import { Canvas, useFrame } from '@react-three/fiber';
import { Product } from '../data/products';
import JewelryModel from '../components/JewelryModel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabase';

// AI Tracking Imports
import * as tf from '@tensorflow/tfjs';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// Wrap CameraView with TFJS Tensor capabilities
const TensorCamera = cameraWithTensors(CameraView);

import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

// ARScene component to handle 3D rendering updates on Three.js useFrame loop natively (avoiding React re-renders)
interface ARSceneProps {
  positionRef: React.MutableRefObject<[number, number, number]>;
  rotationRef: React.MutableRefObject<[number, number, number]>;
  autoScaleRef: React.MutableRefObject<number>;
  rightEarPosRef: React.MutableRefObject<[number, number, number] | null>;
  leftEarPosRef: React.MutableRefObject<[number, number, number] | null>;
  modelVisibleRef: React.MutableRefObject<boolean>;
  scale: number;
  selectedStyle: string;
  isHandJewelry: boolean;
  jewelryType: string;
  imageUrl?: string;
}

const ARScene: React.FC<ARSceneProps> = ({
  positionRef,
  rotationRef,
  autoScaleRef,
  rightEarPosRef,
  leftEarPosRef,
  modelVisibleRef,
  scale,
  selectedStyle,
  isHandJewelry,
  jewelryType,
  imageUrl,
}) => {
  const mainGroupRef = useRef<any>(null);

  useFrame(() => {
    const visible = modelVisibleRef.current;
    const rot = rotationRef.current;
    const autoS = autoScaleRef.current;

    // Always treat as necklace/neck placement
    if (mainGroupRef.current) {
      mainGroupRef.current.visible = visible;
      if (visible) {
        const pos = positionRef.current;
        mainGroupRef.current.position.set(pos[0], pos[1], pos[2]);
        mainGroupRef.current.rotation.set(rot[0], rot[1], rot[2]);
        mainGroupRef.current.scale.set(scale * 1.5 * autoS, scale * 1.5 * autoS, scale * 1.5 * autoS);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} />

      <group ref={mainGroupRef}>
        <JewelryModel type={selectedStyle} imageUrl={imageUrl} />
      </group>
    </>
  );
};

const ARTryOnScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ARTryOn'>>();
  const { product } = route.params;
  
  // Always use face/neck tracking (necklaces) for all products
  const jewelryType = 'necklace';
  const isHandJewelry = false;
  const isFaceJewelry = true;

  const { user } = useAuth();
  
  // Lead Form States
  const [showLeadForm, setShowLeadForm] = useState<boolean | null>(null); // null means checking
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  // Check if lead details are already known (via logged-in user profile or local AsyncStorage)
  useEffect(() => {
    async function checkExistingDetails() {
      try {
        // 1. Check if authenticated user has a phone number
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .eq('id', user.id)
            .single();

          if (data && data.phone_number) {
            setLeadName(data.full_name || '');
            setLeadPhone(data.phone_number || '');
            setShowLeadForm(false);
            return;
          }
        }

        // 2. Check local AsyncStorage for guest lead details
        const storedName = await AsyncStorage.getItem('@ar_lead_name');
        const storedPhone = await AsyncStorage.getItem('@ar_lead_phone');

        if (storedName && storedPhone) {
          setLeadName(storedName);
          setLeadPhone(storedPhone);
          setShowLeadForm(false);
        } else {
          setShowLeadForm(true);
        }
      } catch (err) {
        console.warn('Error checking existing lead details:', err);
        setShowLeadForm(true);
      }
    }

    checkExistingDetails();
  }, [user]);

  const handleLeadSubmit = async () => {
    const isNameInvalid = leadName.trim().length < 3;
    const isPhoneInvalid = leadPhone.trim().length !== 10;

    setNameError(isNameInvalid);
    setPhoneError(isPhoneInvalid);

    if (isNameInvalid || isPhoneInvalid) return;

    setLeadSubmitting(true);
    try {
      // 1. Save to Supabase ar_leads table
      const { error } = await supabase
        .from('ar_leads')
        .insert([{
          full_name: leadName.trim(),
          phone_number: leadPhone.trim(),
          product_id: product.id,
          product_name: product.name,
        }]);

      if (error) {
        console.warn('Supabase lead insert error:', error.message);
      }

      // 2. Save locally so they don't have to fill it out again
      await AsyncStorage.setItem('@ar_lead_name', leadName.trim());
      await AsyncStorage.setItem('@ar_lead_phone', leadPhone.trim());

      // 3. Hide the form and trigger tracking
      setShowLeadForm(false);
    } catch (err) {
      console.error('Lead submit error:', err);
      // Fallback: still let them try on even if network fails
      setShowLeadForm(false);
    } finally {
      setLeadSubmitting(false);
    }
  };

  const onBack = () => navigation.goBack();
  const [permission, requestPermission] = useCameraPermissions();
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  const handDetectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const faceDetectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  
  // Interactive Ref Coordinates for 60fps tracking without React re-renders
  const positionRef = useRef<[number, number, number]>([0, 0, 0]);
  const rotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const autoScaleRef = useRef<number>(1);
  const rightEarPosRef = useRef<[number, number, number] | null>(null);
  const leftEarPosRef = useRef<[number, number, number] | null>(null);
  
  const modelVisibleRef = useRef(false);
  const debugInfoRef = useRef('Initializing AI...');

  const [scale, setScale] = useState(1);
  const [isTracking, setIsTracking] = useState(true);
  const [modelVisible, setModelVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing AI...');

  // State-update throttlers / wrappers to prevent redundant React re-renders
  const updateVisibility = (visible: boolean) => {
    if (modelVisibleRef.current !== visible) {
      modelVisibleRef.current = visible;
      setModelVisible(visible);
    }
  };

  const updateDebugInfo = (info: string) => {
    if (debugInfoRef.current !== info) {
      debugInfoRef.current = info;
      setDebugInfo(info);
    }
  };

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
    if (showLeadForm !== false) return; // Wait until lead details are verified
    
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
  }, [isHandJewelry, isFaceJewelry, showLeadForm]);

  // Web Frame Processing Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !isDetectorReady) return;

    let frameId: number;
    let isProcessing = false;
    
    async function processFrame() {
      if (!isTracking) {
        // Sleep a bit and check again, instead of spinning at 60fps
        setTimeout(processFrame, 100);
        return;
      }
      
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
                // 1. Position alignment
                positionRef.current = [(keypoint.x / video.videoWidth) * 10 - 5, -(keypoint.y / video.videoHeight) * 10 + 5, 0];
                
                // 2. Hand auto-scaling based on hand bounding scale (distance from wrist to MCP)
                const wrist = hands[0].keypoints[0];
                const middleMcp = hands[0].keypoints[9];
                const handSize = Math.sqrt((middleMcp.x - wrist.x)**2 + (middleMcp.y - wrist.y)**2);
                const handFraction = handSize / video.videoWidth;
                const baselineHandFraction = 0.2;
                autoScaleRef.current = handFraction / baselineHandFraction;
                
                // 3. Hand roll rotation (Z-axis angle)
                const dx = middleMcp.x - wrist.x;
                const dy = middleMcp.y - wrist.y;
                const handAngle = Math.atan2(dy, dx);
                rotationRef.current = [0, 0, handAngle + Math.PI / 2];

                updateVisibility(true);
                updateDebugInfo('HAND OK');
              }
            } else {
              updateVisibility(false);
            }
          } else if (isFaceJewelry && faceDetectorRef.current) {
            const faces = await faceDetectorRef.current.estimateFaces(imageTensor, { flipHorizontal: true });
            if (faces && faces.length > 0) {
              const face = faces[0];
              
              // 1. Get landmarks (use nose instead of forehead for stability when close)
              const chin = face.keypoints[152];
              const nose = face.keypoints[1];
              const rEar = face.keypoints[234];
              const lEar = face.keypoints[454];

              // 2. Face scale estimation based on nose-to-chin distance (immune to top/bottom cropping)
              const noseToChin = Math.sqrt((chin.x - nose.x)**2 + (chin.y - nose.y)**2);
              const faceScaleFraction = noseToChin / video.videoWidth;
              const baselineScaleFraction = 0.12; // baseline ratio at normal distance
              autoScaleRef.current = faceScaleFraction / baselineScaleFraction;

              // 3. Head roll rotation
              const dx = lEar.x - rEar.x;
              const dy = lEar.y - rEar.y;
              const rollAngle = Math.atan2(dy, dx);
              rotationRef.current = [0, 0, rollAngle];

              // 4. Set positions (always neck placement for all items)
              const neckY = chin.y + noseToChin * 1.35; // shift down by 1.35x nose-to-chin distance
              positionRef.current = [
                (chin.x / video.videoWidth) * 10 - 5, 
                -(neckY / video.videoHeight) * 10 + 5, 
                0.5 // slightly forward
              ];
              
              updateVisibility(true);
              updateDebugInfo('FACE OK');
            } else {
              updateVisibility(false);
            }
          }
          
          imageTensor.dispose(); 
        }
      } catch (err) {
        console.error("Web Processing Error:", err);
      } finally {
        isProcessing = false;
        // Schedule next processing frame sequentially
        frameId = requestAnimationFrame(processFrame);
      }
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
            
            // 1. Position alignment
            positionRef.current = [(kp.x / 152) * 10 - 5, -(kp.y / 200) * 10 + 5, 0];
            
            // 2. Hand auto-scaling (distance from wrist to MCP)
            const wrist = hands[0].keypoints[0];
            const middleMcp = hands[0].keypoints[9];
            const handSize = Math.sqrt((middleMcp.x - wrist.x)**2 + (middleMcp.y - wrist.y)**2);
            const handFraction = handSize / 152;
            const baselineHandFraction = 0.2;
            autoScaleRef.current = handFraction / baselineHandFraction;
            
            // 3. Hand roll rotation (Z-axis angle)
            const dx = middleMcp.x - wrist.x;
            const dy = middleMcp.y - wrist.y;
            const handAngle = Math.atan2(dy, dx);
            rotationRef.current = [0, 0, handAngle + Math.PI / 2];

            updateVisibility(true);
            updateDebugInfo('HAND OK');
          } else {
            updateVisibility(false);
          }
        } else if (isFaceJewelry && faceDetectorRef.current) {
          const faces = await faceDetectorRef.current.estimateFaces(imageTensor, { flipHorizontal: false });
          if (faces && faces.length > 0) {
            const face = faces[0];
            
            // 1. Get landmarks (use nose instead of forehead for stability when close)
            const chin = face.keypoints[152];
            const nose = face.keypoints[1];
            const rEar = face.keypoints[234];
            const lEar = face.keypoints[454];

            // 2. Face scale estimation based on nose-to-chin distance (immune to top/bottom cropping)
            const noseToChin = Math.sqrt((chin.x - nose.x)**2 + (chin.y - nose.y)**2);
            const faceScaleFraction = noseToChin / 152;
            const baselineScaleFraction = 0.12; // baseline ratio at normal distance
            autoScaleRef.current = faceScaleFraction / baselineScaleFraction;

            // 3. Head roll rotation
            const dx = lEar.x - rEar.x;
            const dy = lEar.y - rEar.y;
            const rollAngle = Math.atan2(dy, dx);
            rotationRef.current = [0, 0, rollAngle];

            // 4. Set positions (always neck placement for all items)
            const neckY = chin.y + noseToChin * 1.35; // shift down by 1.35x nose-to-chin distance
            positionRef.current = [
              (chin.x / 152) * 10 - 5, 
              -(neckY / 200) * 10 + 5, 
              0.5 // slightly forward
            ];
            
            updateVisibility(true);
            updateDebugInfo('FACE OK');
          } else {
            updateVisibility(false);
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

  if (showLeadForm === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={[styles.loadingText, { marginTop: 15 }]}>Checking details...</Text>
      </View>
    );
  }

  if (showLeadForm) {
    return (
      <View style={styles.leadContainer}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.leadWrapper}
        >
          <View style={styles.leadCard}>
            <FontAwesome5 name="camera" size={32} color="#D4AF37" style={styles.leadIcon} />
            <Text style={styles.leadTitle}>Virtual Try-On</Text>
            <Text style={styles.leadSubtitle}>
              Experience our luxury jewelry collections. Share your details to start the AR Try-On.
            </Text>

            <View style={styles.leadForm}>
              <Text style={styles.leadLabel}>Full Name</Text>
              <TextInput
                style={styles.leadInput}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={leadName}
                onChangeText={(t) => {
                  setLeadName(t);
                  setNameError(false);
                }}
              />
              {nameError && (
                <Text style={styles.leadErrorText}>Please enter your name (min 3 characters).</Text>
              )}

              <Text style={[styles.leadLabel, { marginTop: 15 }]}>Mobile Number</Text>
              <TextInput
                style={styles.leadInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                maxLength={10}
                value={leadPhone}
                onChangeText={(t) => {
                  setLeadPhone(t.replace(/[^0-9]/g, ''));
                  setPhoneError(false);
                }}
              />
              {phoneError && (
                <Text style={styles.leadErrorText}>Please enter a valid 10-digit number.</Text>
              )}

              <TouchableOpacity
                style={[styles.leadSubmitBtn, leadSubmitting && styles.leadSubmitBtnDisabled]}
                onPress={handleLeadSubmit}
                disabled={leadSubmitting}
                activeOpacity={0.8}
              >
                {leadSubmitting ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.leadSubmitBtnText}>Start Virtual Try-On</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.leadCancelBtn} 
                onPress={handleClose}
                disabled={leadSubmitting}
              >
                <Text style={styles.leadCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

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
          <ARScene
            positionRef={positionRef}
            rotationRef={rotationRef}
            autoScaleRef={autoScaleRef}
            rightEarPosRef={rightEarPosRef}
            leftEarPosRef={leftEarPosRef}
            modelVisibleRef={modelVisibleRef}
            scale={scale}
            selectedStyle={selectedStyle}
            isHandJewelry={isHandJewelry}
            jewelryType={jewelryType}
            imageUrl={product.image}
          />
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
  leadContainer: {
    flex: 1,
    backgroundColor: '#1a1209',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadWrapper: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  leadCard: {
    backgroundColor: '#291c0e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }
    } as any)
  },
  leadIcon: {
    marginBottom: 16,
  },
  leadTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  leadSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  leadForm: {
    width: '100%',
  },
  leadLabel: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  leadInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  leadErrorText: {
    color: '#FF5252',
    fontSize: 11,
    marginTop: 6,
  },
  leadSubmitBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  leadSubmitBtnDisabled: {
    opacity: 0.6,
  },
  leadSubmitBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  leadCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  leadCancelBtnText: {
    color: '#a8927e',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default ARTryOnScreen;
