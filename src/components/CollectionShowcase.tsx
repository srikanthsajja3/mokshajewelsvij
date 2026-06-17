import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import OptimizedImage from './OptimizedImage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width > 768 ? (width - 60) / 3 : width - 40;

const COLLECTIONS = [
  {
    id: '1',
    title: 'The Gold Heritage',
    subtitle: 'Timeless 22K Tradition',
    category: 'Gold',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '2',
    title: 'Diamond Radiance',
    subtitle: 'Brilliance in every cut',
    category: 'Diamonds',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: '3',
    title: 'Bridal Elegance',
    subtitle: 'For your special day',
    category: 'Gold', // Assuming Bridal is mostly Gold for now
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&q=80&w=800',
  }
];

interface CollectionShowcaseProps {
  onSelectCategory: (category: string) => void;
}

const CollectionShowcase: React.FC<CollectionShowcaseProps> = ({ onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Curated Collections</Text>
        <Text style={styles.subtitle}>Handpicked selections for every occasion</Text>
      </View>

      <View style={styles.grid}>
        {COLLECTIONS.map((col) => (
          <TouchableOpacity 
            key={col.id} 
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => onSelectCategory(col.category)}
          >
            <OptimizedImage 
              url={col.image} 
              style={[StyleSheet.absoluteFillObject]} 
              contentFit="cover"
              shouldLoad={true}
            />
            <View style={styles.overlay}>
              <Text style={styles.cardTitle}>{col.title}</Text>
              <Text style={styles.cardSubtitle}>{col.subtitle}</Text>
              <View style={styles.btn}>
                <Text style={styles.btnText}>EXPLORE</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 24,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  card: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.2,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#3d2b1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 25,
  },
  cardTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 20,
    color: '#D4AF37',
    marginBottom: 5,
  },
  cardSubtitle: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 15,
    opacity: 0.8,
  },
  btn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 2,
  },
  btnText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CollectionShowcase;
