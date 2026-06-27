import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import OptimizedImage from './OptimizedImage';

interface ProductImageGalleryProps {
  allImages: string[];
  mainImageWidth: number;
  isLargeScreen: boolean;
  isInWishlist: boolean;
  onWishlistToggle: () => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  allImages,
  mainImageWidth,
  isLargeScreen,
  isInWishlist,
  onWishlistToggle,
}) => {
  const [activeImageIndex, setActiveIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const imageScrollRef = useRef<ScrollView>(null);

  // Web-only refs for direct DOM manipulation to achieve 60fps hover zoom without React re-renders
  const zoomOverlayRef = useRef<any>(null);
  const zoomedImageRef = useRef<any>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [allImages]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / mainImageWidth);
    if (index !== activeImageIndex && index >= 0 && index < allImages.length) {
      setActiveIndex(index);
    }
  };

  const handleThumbnailPress = (index: number) => {
    setActiveIndex(index);
    imageScrollRef.current?.scrollTo({ x: index * mainImageWidth, animated: true });
  };

  const handleMouseMove = (e: any) => {
    if (!isLargeScreen || Platform.OS !== 'web') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Use direct DOM manipulation on web to prevent React state re-renders at 60fps
    if (zoomOverlayRef.current) {
      zoomOverlayRef.current.style.display = 'block';
    }
    if (zoomedImageRef.current) {
      zoomedImageRef.current.style.backgroundImage = `url(${allImages[activeImageIndex]})`;
      zoomedImageRef.current.style.backgroundPosition = `${x}% ${y}%`;
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && zoomOverlayRef.current) {
      zoomOverlayRef.current.style.display = 'none';
    }
  };

  const viewerImages = useMemo(() => {
    return allImages.map(url => ({ url }));
  }, [allImages]);

  const thumbnailWidth = 64;
  const thumbnailSpacing = 12;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: isLargeScreen ? "row" : "column" }}>
        {isLargeScreen && allImages.length > 1 && (
          <View style={styles.thumbnailColumn}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {allImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnailCard,
                    activeImageIndex === index && styles.activeThumbnailCard
                  ]}
                  onPress={() => handleThumbnailPress(index)}
                  // @ts-ignore
                  onMouseEnter={() => handleThumbnailPress(index)}
                >
                  <OptimizedImage
                    url={img}
                    style={styles.thumbnailImage}
                    contentFit="cover"
                    shouldLoad={true}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.imageSection, { 
          width: mainImageWidth, 
          height: mainImageWidth,
        }]}>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {allImages.map((img, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.imageWrapper, 
                  { 
                    width: mainImageWidth,
                    height: mainImageWidth
                  }
                ]}
                activeOpacity={1}
                // @ts-ignore
                onMouseMove={handleMouseMove}
                // @ts-ignore
                onMouseLeave={handleMouseLeave}
                onPress={() => {
                  setActiveIndex(index);
                  setIsViewerVisible(true);
                }}
              >
                <OptimizedImage 
                  url={img} 
                  style={styles.mainImage} 
                  contentFit="contain" 
                  shouldLoad={true} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {allImages.length > 1 && (
            <View style={styles.pagination}>
              {allImages.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    activeImageIndex === i && styles.activeDot
                  ]} 
                />
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={styles.wishlistIcon} 
            onPress={onWishlistToggle}
          >
            <Text style={[styles.heart, isInWishlist && styles.heartActive]}>
              {isInWishlist ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Web zoom overlay - container matches design, uses DOM ref to update style natively */}
      {Platform.OS === 'web' && isLargeScreen && (
        <div 
          ref={zoomOverlayRef}
          style={{
            position: "absolute",
            top: 0,
            left: `${mainImageWidth + (allImages.length > 1 ? thumbnailWidth + thumbnailSpacing : 0) + 20}px`,
            width: "350px",
            height: "350px",
            backgroundColor: "#1a120b",
            border: "2px solid #D4AF37",
            borderRadius: "8px",
            zIndex: 1000,
            overflow: "hidden",
            display: "none",
            pointerEvents: "none",
            boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
          }}
        >
          <div 
            ref={zoomedImageRef}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#1a120b",
              backgroundRepeat: "no-repeat",
              backgroundSize: "400%",
            }}
          />
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={isViewerVisible} transparent={true} onRequestClose={() => setIsViewerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <ImageViewer 
            imageUrls={viewerImages}
            index={activeImageIndex}
            onSwipeDown={() => setIsViewerVisible(false)}
            enableSwipeDown={true}
            renderHeader={() => <View />} // Clear default header
            renderIndicator={(currentIndex, allSize) => (
              <View style={{ position: 'absolute', top: 40, width: '100%', flexDirection: 'row', justifyContent: 'center', zIndex: 1 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>{`${currentIndex} / ${allSize}`}</Text>
              </View>
            )}
          />
          <TouchableOpacity 
            style={{ 
              position: 'absolute', 
              top: Platform.OS === 'ios' ? 40 : 20, 
              right: 20, 
              zIndex: 10000, 
              padding: 15, 
              backgroundColor: 'rgba(0,0,0,0.6)', 
              borderRadius: 25 
            }} 
            onPress={() => setIsViewerVisible(false)}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  thumbnailColumn: {
    width: 64,
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnailScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  thumbnailCard: {
    width: 64,
    height: 64,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    overflow: 'hidden',
    backgroundColor: '#201409',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    })
  },
  activeThumbnailCard: {
    borderColor: '#D4AF37',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  imageSection: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#1a120b",
    borderWidth: 1,
    borderColor: "#4a3520",
    position: "relative",
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#D4AF37',
    width: 12,
  },
  wishlistIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  heart: {
    color: "#fff",
    fontSize: 24,
  },
  heartActive: {
    color: "#D4AF37",
  },
});

export default ProductImageGallery;
