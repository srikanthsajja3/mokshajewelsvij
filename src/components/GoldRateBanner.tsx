import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useGoldRate } from '../contexts/GoldRateContext';

const GoldRateBanner: React.FC = () => {
  const { rates, getLocalizedRate, isLoading } = useGoldRate();

  if (isLoading) {
    return (
      <View style={styles.banner}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.banner}>
      <View style={styles.tickerContainer}>
        {rates.map((item, index) => (
          <View key={item.purity} style={styles.rateItem}>
            <Text style={styles.purityText}>{item.purity}:</Text>
            <Text style={styles.rateText}>{getLocalizedRate(item.rate)}</Text>
            {index < rates.length - 1 && <Text style={styles.separator}> | </Text>}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1a1209',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    marginLeft: 12,
    fontSize: 14,
  }
});

export default GoldRateBanner;
