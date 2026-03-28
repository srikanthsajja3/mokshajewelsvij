import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  Platform,
  ScrollView
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SideDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  activeScreen: string;
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.6 > 260 ? 260 : width * 0.6;

const SideDrawer: React.FC<SideDrawerProps> = ({ isVisible, onClose, onNavigate, activeScreen }) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { user, isAdmin, isVendor, signOut } = useAuth();

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleNavigate = (screen: string) => {
    onNavigate(screen as any);
    onClose();
  };

  const NavItem = ({ icon, label, screen, badge }: { icon: string, label: string, screen: string, badge?: string }) => {
    const isActive = activeScreen === screen;
    return (
      <TouchableOpacity 
        style={[styles.navItem, isActive && styles.activeNavItem]} 
        onPress={() => handleNavigate(screen)}
      >
        <View style={styles.navIconContainer}>
          <FontAwesome5 name={icon} size={18} color={isActive ? "#D4AF37" : "#aaa"} />
        </View>
        <Text style={[styles.navLabel, isActive && styles.activeNavLabel]}>{label}</Text>
        {badge ? (
          <View style={[styles.badge, badge === 'ADMIN' ? styles.adminBadge : styles.vendorBadge]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (!isVisible && slideAnim._value === -DRAWER_WIDTH) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10000 }]} pointerEvents={isVisible ? "auto" : "none"}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim, zIndex: 10000 }]} />
      </TouchableWithoutFeedback>

      {/* Drawer Content */}
      <Animated.View style={[
        styles.drawer, 
        { 
          transform: [{ translateX: slideAnim }],
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          zIndex: 10001
        }
      ]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>MOKSHA JEWELS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.navScroll}>
          <NavItem icon="home" label="Home" screen="home" />
          <NavItem icon="heart" label="Wishlist" screen="wishlist" />
          
          {user ? (
            <>
              <NavItem icon="history" label="My Orders" screen="orders" />
              <NavItem icon="user-circle" label="Profile" screen="profile" />
            </>
          ) : null}

          <View style={styles.separator} />

          {isAdmin ? (
            <NavItem icon="user-shield" label="Admin Portal" screen="admin" badge="ADMIN" />
          ) : null}

          {isVendor ? (
            <NavItem icon="store" label="Partner Portal" screen="vendor" badge="PARTNER" />
          ) : null}

          {!user ? (
            <NavItem icon="sign-in-alt" label="Login / Sign Up" screen="login" />
          ) : null}
        </ScrollView>

        {user ? (
          <TouchableOpacity style={styles.logoutButton} onPress={() => { signOut(); onClose(); }}>
            <FontAwesome5 name="sign-out-alt" size={16} color="#ff4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#291c0e',
    borderRightWidth: 1,
    borderRightColor: 'rgba(212, 175, 55, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  drawerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Trajan Pro' : 'TrajanPro',
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 5,
  },
  navScroll: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  activeNavItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  navIconContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  navLabel: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  activeNavLabel: {
    color: '#D4AF37',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  badge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadge: {
    backgroundColor: '#D4AF37',
  },
  vendorBadge: {
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.1)',
  },
  logoutText: {
    color: '#ff4444',
    marginLeft: 15,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SideDrawer;
