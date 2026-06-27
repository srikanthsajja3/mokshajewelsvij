import React, { useState, useEffect, useRef } from "react";
import { View, ScrollView, StyleSheet, useWindowDimensions, Text, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Image } from "expo-image";
import { supabase } from "../../supabase";

const LOCAL_SLIDER_IMAGES = [
  { id: "1", source: require("../../assets/a.jpg"), alt: "Moksha Jewels Bridal Collection - Gold and Diamonds" },
  { id: "2", source: require("../../assets/b.jpg"), alt: "Exquisite Handcrafted Jewellery - Premium Boutique" },
  { id: "3", source: require("../../assets/c.jpg"), alt: "BIS Hallmarked Gold Ornaments - Traditional Designs" },
  { id: "4", source: require("../../assets/d.jpg"), alt: "Certified Diamond Jewellery - Shaped Diamonds" },
];

const ImageScroller = () => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const scrollerHeight = width > 1400 ? 600 : (width > 768 ? 450 : 250);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_banners')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          setBanners(data.map(item => ({
            id: item.id,
            image_url: item.image_url,
            alt_text: item.alt_text || '',
            isLocal: false
          })));
        } else {
          // Fallback to local images
          setBanners(LOCAL_SLIDER_IMAGES.map(img => ({
            id: img.id,
            image_url: img.source,
            alt_text: img.alt,
            isLocal: true
          })));
        }
      } catch (err) {
        console.warn("Failed to fetch banners:", err);
        setBanners(LOCAL_SLIDER_IMAGES.map(img => ({
          id: img.id,
          image_url: img.source,
          alt_text: img.alt,
          isLocal: true
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, width, banners.length]);

  const handleManualScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / width);
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  };

  if (loading || banners.length === 0) {
    return <View style={[styles.container, { height: scrollerHeight }]} />;
  }

  return (
    <View style={[styles.container, { height: scrollerHeight }]}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleManualScroll}
        scrollEventThrottle={16}
      >
        {banners.map((img) => (
          <View key={img.id} style={[styles.imageWrapper, { width }]}>
            <Image 
              source={img.isLocal ? img.image_url : { uri: img.image_url }} 
              style={[styles.image, { height: scrollerHeight }]} 
              accessibilityLabel={img.alt_text}
              contentFit="cover"
              transition={300}
            />
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? "#D4AF37" : "rgba(255,255,255,0.5)" }
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
    position: "relative",
  },
  imageWrapper: {
    paddingHorizontal: 0,
  },
  image: {
    width: "100%",
    borderRadius: 0,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  imageTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 40,
    right: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ImageScroller;
