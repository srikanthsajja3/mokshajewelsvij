import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { getOptimizedImageUrl } from '../utils/images';

interface OptimizedImageProps {
  url: string;
  width?: number;
  height?: number;
  quality?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  shouldLoad?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  url,
  width = 400,
  height = 400,
  quality = 80,
  style,
  containerStyle,
  contentFit = 'cover',
  shouldLoad = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [loadTriggered, setLoadTriggered] = useState(shouldLoad);

  // Reset states when the source URL changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    if (shouldLoad) setLoadTriggered(true);
  }, [url]);

  // Trigger load when shouldLoad becomes true
  useEffect(() => {
    if (shouldLoad && !loadTriggered) {
      setLoadTriggered(true);
    }
  }, [shouldLoad]);

  const imageUrl = useMemo(() => {
    return getOptimizedImageUrl(url, { width, height, quality });
  }, [url, width, height, quality]);

  if (!loadTriggered) {
    return <View style={[styles.container, containerStyle, style]} />;
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      {error ? (
        <View style={styles.errorContainer}>
          <ImageOff size={24} color="#5a4028" />
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, style]}
          contentFit={contentFit}
          transition={300}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            console.error(`[OptimizedImage] Failed to load: ${imageUrl}`, e);
            setError(true);
            setLoading(false);
          }}
        />
      )}
      {loading && !error && (
        <View style={styles.loader}>
          <ActivityIndicator color="#D4AF37" size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#3d2b1a',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#291c0e',
  }
});

export default OptimizedImage;
