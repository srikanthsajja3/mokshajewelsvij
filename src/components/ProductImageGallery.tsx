import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleZoomChange = (newVal: number) => {
    const clamped = Math.max(1, Math.min(3, parseFloat(newVal.toFixed(2))));
    setZoomScale(clamped);
    if (clamped === 1) {
      setPanPos({ x: 0, y: 0 });
    }
  };

  const handleMinus = () => {
    handleZoomChange(zoomScale - 0.2);
  };

  const handlePlus = () => {
    handleZoomChange(zoomScale + 0.2);
  };

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    const prevIndex = activeImageIndex === 0 ? allImages.length - 1 : activeImageIndex - 1;
    setActiveIndex(prevIndex);
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    const nextIndex = activeImageIndex === allImages.length - 1 ? 0 : activeImageIndex + 1;
    setActiveIndex(nextIndex);
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panPos.x,
      panY: panPos.y,
    };
  };

  const handleMouseMoveModal = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanPos({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panX: panPos.x,
      panY: panPos.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPanPos({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };
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
                activeOpacity={0.9}
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
      {/* Dedicated Full Screen Black Overlay via Portal */}
      {isViewerVisible && Platform.OS === 'web' && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          zIndex: 2147483647,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {/* Close X Button */}
          <button 
            type="button"
            onClick={() => {
              setZoomScale(1);
              setPanPos({ x: 0, y: 0 });
              setIsViewerVisible(false);
            }}
            style={{ 
              position: 'absolute', 
              top: '24px', 
              right: '24px', 
              zIndex: 2147483647, 
              background: 'rgba(255, 255, 255, 0.15)', 
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              color: '#ffffff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            ✕
          </button>

          {/* Previous Image Button (<) */}
          {allImages.length > 1 && (
            <button 
              type="button"
              onClick={handlePrevImage}
              style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2147483647,
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                color: '#D4AF37',
                fontSize: '26px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease'
              }}
            >
              ‹
            </button>
          )}

          {/* Next Image Button (>) */}
          {allImages.length > 1 && (
            <button 
              type="button"
              onClick={handleNextImage}
              style={{
                position: 'absolute',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2147483647,
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                color: '#D4AF37',
                fontSize: '26px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                transition: 'all 0.2s ease'
              }}
            >
              ›
            </button>
          )}

          {/* Full Screen Image Container */}
          <div 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveModal}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              width: '100vw',
              height: '100vh',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              overflow: 'hidden',
              cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none'
            }}
          >
            <img 
              src={allImages[activeImageIndex]} 
              alt="Full screen view"
              draggable={false}
              style={{
                maxWidth: '92vw',
                maxHeight: '92vh',
                objectFit: 'contain',
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                userSelect: 'none'
              }}
            />
          </div>

          {/* Range Zoom Controls (Slide Bar + / -) */}
          <div 
            className="rangeZoom"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: '36px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2147483647,
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              padding: '10px 20px',
              borderRadius: '30px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}
          >
            <button 
              type="button" 
              data-zoom="rangeZoom" 
              className="rangeZoom__buttonMinus"
              onClick={handleMinus}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 6px',
                color: '#D4AF37',
                fontSize: '24px',
                fontWeight: 'bold',
                lineHeight: 1,
                userSelect: 'none'
              }}
            >
              −
            </button> 
            <input 
              type="range" 
              min="1" 
              value={zoomScale}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              step="0.1" 
              max="2.5" 
              data-zoom="zoomer" 
              className="rangeZoom__buttonRange"
              style={{
                accentColor: '#D4AF37',
                cursor: 'pointer',
                width: '140px'
              }}
            /> 
            <button 
              type="button" 
              data-zoom="zoomRangeButtonPlus" 
              className="rangeZoom__buttonPlus"
              onClick={handlePlus}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 6px',
                color: '#D4AF37',
                fontSize: '24px',
                fontWeight: 'bold',
                lineHeight: 1,
                userSelect: 'none'
              }}
            >
              +
            </button> 
          </div>
        </div>,
        document.body
      )}
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
