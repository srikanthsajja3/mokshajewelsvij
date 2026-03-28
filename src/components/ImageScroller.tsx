import React, { useState, useEffect, useRef } from "react";
import { View, Image, ScrollView, StyleSheet, useWindowDimensions, Text, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

const SLIDER_IMAGES = [
  { id: "1", source: require("../../assets/a.jpg")  },
  { id: "2", source: require("../../assets/b.jpg")  },
  { id: "3", source: require("../../assets/c.jpg") },
  { id: "4", source: require("../../assets/d.jpg") },
];

const ImageScroller = () => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const scrollerHeight = width > 768 ? 450 : 250;

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= SLIDER_IMAGES.length) {
        nextIndex = 0;
      }
      
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, width]);

  const handleManualScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / width);
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  };

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
        {SLIDER_IMAGES.map((img) => (
          <View key={img.id} style={[styles.imageWrapper, { width }]}>
            <Image source={img.source} style={[styles.image, { height: scrollerHeight }]} />
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.pagination}>
        {SLIDER_IMAGES.map((_, index) => (
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
