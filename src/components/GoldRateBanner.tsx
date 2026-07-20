import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useGoldRate } from '../contexts/GoldRateContext';

const HoverRateItem = ({ purity, rateText }: { purity: string; rateText: string }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <View 
      style={[
        styles.rateItem,
        hovered && styles.rateItemHovered
      ]}
      // @ts-ignore
      onMouseEnter={() => setHovered(true)}
      // @ts-ignore
      onMouseLeave={() => setHovered(false)}
    >
      <Text style={styles.purityText}>{purity}:</Text>
      <Text style={styles.rateText}>{rateText}</Text>
    </View>
  );
};

const GoldRateBanner: React.FC = () => {
  const { rates, getLocalizedRate, isLoading } = useGoldRate();
  const { width } = useWindowDimensions();

  if (isLoading) {
    return (
      <View style={styles.banner}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  const isDesktop = width >= 768;

  return (
    <View style={styles.banner}>
      <View style={[
        styles.tickerContainer,
        { justifyContent: isDesktop ? 'space-evenly' : 'center' }
      ]}>
        {rates.map((item) => (
          <HoverRateItem 
            key={item.purity} 
            purity={item.purity} 
            rateText={getLocalizedRate(item.rate)} 
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1209',
    paddingVertical: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 15,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    margin: 4,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      }
    }) as any,
  },
  rateItemHovered: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    ...Platform.select({
      web: {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.15)',
      }
    }) as any,
  },
  purityText: {
    color: 'rgba(212, 175, 55, 0.8)',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Trajan Pro' : 'TrajanPro',
    letterSpacing: 0.5,
  },
});

export default GoldRateBanner;
