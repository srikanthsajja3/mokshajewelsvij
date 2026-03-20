import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { useCountry } from "../contexts/CountryContext";
import { useAuth } from "../contexts/AuthContext";
import GoldRateBanner from "./GoldRateBanner";

interface HeaderProps {
  onPressLogo?: () => void;
  onPressLogin?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPressLogo, onPressLogin }) => {
  const { width } = useWindowDimensions();
  const { countryCode, setCountryCode } = useCountry();
  const { user, signOut } = useAuth();
  
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  
  // User manual logo sizes preserved:
  const logoSize = width > 768 ? 110 : (isIOS ? 80 : 40);
  
  // Dynamic title size based on screen width
  const titleSize = width > 768 ? 40 : (width < 380 ? 20 : 24);
  const letterSpacing = width > 768 ? 3 : 1;
  
  const paddingHorz = isWeb 
    ? (width > 1400 ? 40 : 20)
    : (width > 1200 ? width * 0.05 : 15);

  const toggleCountry = () => {
    setCountryCode(countryCode === "IN" ? "US" : "IN");
  };

  return (
    <View style={styles.container}>
      {/* Main Header Area */}
      <View style={[styles.header, { paddingHorizontal: paddingHorz }]}>
        <View style={styles.leftGroup}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={onPressLogo}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/logo.jpg")}
              style={[styles.logo, { width: logoSize, height: logoSize, borderRadius: 12 }]}
            />
            <View style={[styles.textContainer, { maxWidth: width - 180 }]}>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                style={[styles.title, { fontSize: titleSize, letterSpacing: letterSpacing }]}
              >
                MOKSHA JEWELS
              </Text>
              
              <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.countrySelector} onPress={toggleCountry}>
                  <Text style={styles.countryText}>
                    {countryCode === "IN" ? "🇮🇳 INDIA" : "🇺🇸 USA"}
                  </Text>
                </TouchableOpacity>

                {user ? (
                  <TouchableOpacity style={styles.authContainer} onPress={signOut}>
                    <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.authContainer} onPress={onPressLogin}>
                    <Text style={styles.loginText}>LOGIN</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gold Rate Banner */}
      <GoldRateBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#291c0e",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 20, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    marginRight: 15,
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontFamily: "TrajanPro",
    color: "#D4AF37",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  countrySelector: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: 4,
    marginRight: 10,
  },
  countryText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  authContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  userEmail: {
    color: "#aaa",
    fontSize: 10,
    marginRight: 8,
    maxWidth: 100,
  },
  logoutText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  loginText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
});

export default Header;
