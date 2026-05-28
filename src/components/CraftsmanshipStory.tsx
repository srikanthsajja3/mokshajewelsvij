import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  useWindowDimensions 
} from 'react-native';

const CraftsmanshipStory = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.content, isMobile && { flexDirection: 'column' }]}>
        <View style={[styles.textSection, isMobile && { width: '100%', paddingRight: 0 }]}>
          <Text style={styles.label}>Our Legacy</Text>
          <Text style={styles.title}>The Art of Moksha</Text>
          <Text style={styles.description}>
            For over three decades, Moksha Jewels has been a sanctuary for timeless artistry. 
            Each masterpiece is born from a legacy of passion, where traditional gold-smithing 
            meets modern precision.
          </Text>
          <Text style={styles.description}>
            Our artisans pour their soul into every curve and setting, ensuring that 
            when you wear Moksha, you wear a piece of history.
          </Text>
          
          <View style={styles.pillars}>
            <View style={styles.pillar}>
              <Text style={styles.pillarTitle}>Ethically Sourced</Text>
              <Text style={styles.pillarText}>Only the finest conflict-free diamonds and pure gold.</Text>
            </View>
            <View style={styles.pillar}>
              <Text style={styles.pillarTitle}>Handcrafted</Text>
              <Text style={styles.pillarText}>Master artisans with generations of experience.</Text>
            </View>
          </View>
        </View>

        <View style={[styles.imageSection, isMobile && { width: '100%', marginTop: 30 }]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1573408302185-9127fe589333?auto=format&fit=crop&q=80&w=800' }} 
            style={styles.mainImage} 
          />
          <View style={styles.imageOverlay} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1209',
    paddingVertical: 60,
    paddingHorizontal: 20,
    marginVertical: 40,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    width: '50%',
    paddingRight: 60,
  },
  label: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 15,
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 32,
    color: '#fff',
    marginBottom: 25,
    letterSpacing: 1,
  },
  description: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 20,
  },
  pillars: {
    marginTop: 20,
    gap: 20,
  },
  pillar: {
    borderLeftWidth: 2,
    borderLeftColor: '#D4AF37',
    paddingLeft: 15,
  },
  pillarTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pillarText: {
    color: '#777',
    fontSize: 12,
  },
  imageSection: {
    width: '50%',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 400,
    borderRadius: 4,
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 4,
    top: 20,
    left: 20,
    zIndex: -1,
  },
});

export default CraftsmanshipStory;
