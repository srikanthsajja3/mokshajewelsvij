import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { supabase } from '../../supabase';
import Header from '../components/Header';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onGoHome: () => void;
  onClose: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoHome, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert('Success', 'Check your email for the confirmation link!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header onPressLogo={onGoHome} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{isRegistering ? 'Create Account' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {isRegistering 
                ? 'Sign up to manage your orders and wishlist' 
                : 'Sign in to access your luxury jewelry collection'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.authButton}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isRegistering ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setIsRegistering(!isRegistering)}
            >
              <Text style={styles.switchButtonText}>
                {isRegistering 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#291c0e',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#3d2b1a',
    padding: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 24,
    color: '#D4AF37',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#D4AF37',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#291c0e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 4,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
