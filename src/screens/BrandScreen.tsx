import React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ImageBackground, 
  useWindowDimensions,
  Animated
} from "react-native";
import { StatusBar } from "expo-status-bar";

interface BrandScreenProps {
  onEnterShop: () => void;
}

const BrandScreen: React.FC<BrandScreenProps> = ({ onEnterShop }) => {
  const { width, height } = useWindowDimensions();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground 
        source={require("../../assets/exh2.jpg")} 
        style={[styles.backgroundImage, { width, height }]}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Animated.View style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            <Text style={styles.brandTitle}>MOKSHA JEWELS</Text>
            <View style={styles.divider} />
            <Text style={styles.tagline}>Crafting Elegance for Eternity</Text>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>UNDER CONSTRUCTION</Text>
            </View>

            <Text style={styles.description}>
              Our digital masterpiece is currently being handcrafted. 
              Join us soon for a new era of luxury jewelry.
            </Text>

            <TouchableOpacity 
              style={styles.button} 
              onPress={onEnterShop}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Preview Collections</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 MOKSHA JEWELS. All Rights Reserved.</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#291c0e",
  },
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 600,
  },
  brandTitle: {
    fontFamily: "TrajanPro",
    fontSize: 48,
    color: "#D4AF37",
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "#D4AF37",
    marginVertical: 15,
  },
  tagline: {
    fontFamily: "TrajanPro",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 40,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.5)",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  buttonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  footer: {
    position: "absolute",
    bottom: 40,
  },
  footerText: {
    color: "#666",
    fontSize: 12,
    letterSpacing: 1,
  }
});

export default BrandScreen;
