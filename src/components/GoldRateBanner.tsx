import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, useWindowDimensions } from 'react-native';
import { useGoldRate } from '../contexts/GoldRateContext';

const GoldRateBanner: React.FC = () => {
  const { rates, getLocalizedRate, isLoading } = useGoldRate();
  const { width } = useWindowDimensions();
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const rateItems = useMemo(() => {
    return [...rates, ...rates, ...rates]; // Triple for better looping on wide screens
  }, [rates]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (!isLoading && rateItems.length > 0) {
      const startAnimation = () => {
        // Reset only if it was stopped or finished
        scrollAnim.setValue(0);
        animation = Animated.timing(scrollAnim, {
          toValue: -1, 
          duration: 30000, // Slightly slower for better readability
          easing: Easing.linear,
          useNativeDriver: true,
        });
        
        animation.start(({ finished }) => {
          if (finished) startAnimation();
        });
      };
      
      startAnimation();
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isLoading, rateItems.length]); // Only depend on rates loading state or length change

  if (isLoading) {
    return (
      <View style={styles.banner}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  const animatedStyle = {
    transform: [
      {
        translateX: scrollAnim.interpolate({
          inputRange: [-1, 0],
          outputRange: [-width, 0], 
        }),
      },
    ],
  };

  return (
    <View style={styles.banner}>
      <Animated.View style={[styles.tickerContainer, animatedStyle]}>
        {rateItems.map((item, index) => (
          <View key={`${item.purity}-${index}`} style={styles.rateItem}>
            <Text style={styles.purityText}>{item.purity}:</Text>
            <Text style={styles.rateText}>{getLocalizedRate(item.rate)}</Text>
            <Text style={styles.separator}> | </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1209',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    overflow: 'hidden',
    width: '100%',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  purityText: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 6,
    textTransform: 'uppercase',
  },
  rateText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'TrajanPro',
    letterSpacing: 1,
  },
  separator: {
    color: 'rgba(212, 175, 55, 0.2)',
    marginLeft: 20,
    fontSize: 14,
  }
});

export default GoldRateBanner;
