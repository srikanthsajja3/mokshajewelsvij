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
  StatusBar,
  Modal
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { BlurView } from 'expo-blur';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';

// Allow the auth session to be completed
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  visible: boolean;
  onLoginSuccess: () => void;
  onGoHome: () => void;
  onClose: () => void;
  initialIsUpdatingPassword?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  visible,
  onLoginSuccess, 
  onGoHome, 
  onClose, 
  initialIsUpdatingPassword = false 
}) => {
  const { resetPassword, verifyOtp, setIsRecovering, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(initialIsUpdatingPassword);
  const [successMessage, setSuccessMessage] = useState("");

  React.useEffect(() => {
    if (initialIsUpdatingPassword) {
      setIsUpdatingPassword(true);
      setIsRecovering(false);
    }
  }, [initialIsUpdatingPassword]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage("Success! Check your email for confirmation.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage("Sign in successful! Redirecting...");
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred during authentication.';
      if (errorMessage.includes('Invalid login credentials')) {
        Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
      } else if (errorMessage.includes('Email not confirmed')) {
        Alert.alert('Confirmation Required', 'Please confirm your email address before signing in.');
      } else {
        Alert.alert('Authentication Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setSuccessMessage("");
    try {
      const { data, error } = await signInWithOAuth(provider);
      if (error) throw error;
      
      if (data?.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'mokshajewels://login-callback');
        if (result.type === 'success' && result.url) {
          // Handled by AuthContext listener
        }
      }
    } catch (error: any) {
      Alert.alert('Login Error', error.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccessMessage("Success! Reset link sent to your email.");
      setShowCodeEntry(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) throw error;
      setSuccessMessage("Code verified! Enter new password.");
      setIsResetting(false);
      setShowCodeEntry(false);
      setIsUpdatingPassword(true);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMessage("Password updated! Redirecting...");
      setTimeout(() => {
        setIsUpdatingPassword(false);
        onLoginSuccess();
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </BlurView>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContent}
        >
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              {isUpdatingPassword ? 'Reset Password' : isResetting ? 'Reset Password' : isRegistering ? 'Create Account' : 'Welcome Back'}
            </Text>
            
            <Text style={styles.subtitle}>
              {isUpdatingPassword 
                ? 'Enter a new password for your account'
                : isResetting 
                ? 'Enter your email for a reset link' 
                : isRegistering 
                ? 'Sign up for orders and wishlist' 
                : 'Sign in for your luxury collection'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {successMessage ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {!isUpdatingPassword && (
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
              )}

              {!isResetting && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{isUpdatingPassword ? 'New Password' : 'Password'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={isUpdatingPassword ? "Enter new password" : "Enter your password"}
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              )}

              {!isRegistering && !isResetting && !isUpdatingPassword && (
                <TouchableOpacity 
                  style={styles.forgotButton}
                  onPress={() => setIsResetting(true)}
                >
                  <Text style={styles.forgotButtonText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {showCodeEntry && isResetting && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="#666"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={styles.authButton}
                onPress={isUpdatingPassword ? handleUpdatePassword : showCodeEntry ? handleVerifyCode : isResetting ? handleReset : handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isUpdatingPassword ? 'Update Password' : showCodeEntry ? 'Verify Code' : isResetting ? 'Send Link' : isRegistering ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              {!isResetting && !isUpdatingPassword && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.orText}>OR</Text>
                    <View style={styles.line} />
                  </View>

                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.socialButton, styles.googleButton]} 
                      onPress={() => handleSocialLogin('google')}
                    >
                      <FontAwesome name="google" size={18} color="#fff" style={styles.socialIcon} />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>

                    {Platform.OS !== 'android' && (
                      <TouchableOpacity 
                        style={[styles.socialButton, styles.appleButton]} 
                        onPress={() => handleSocialLogin('apple')}
                      >
                        <FontAwesome name="apple" size={18} color="#fff" style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={styles.switchButton}
                onPress={() => {
                  if (isResetting || isUpdatingPassword) {
                    setIsResetting(false);
                    setIsUpdatingPassword(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                }}
              >
                <Text style={styles.switchButtonText}>
                  {isUpdatingPassword || isResetting 
                    ? 'Back to Sign In' 
                    : isRegistering 
                    ? 'Have an account? Sign In' 
                    : "Need an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  formContainer: {
    backgroundColor: '#3d2b1a',
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
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
    fontSize: 22,
    color: '#D4AF37',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#D4AF37',
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#291c0e',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 4,
    padding: 10,
    color: '#fff',
    fontSize: 15,
  },
  authButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 5,
  },
  authButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginTop: -5,
  },
  forgotButtonText: {
    color: '#D4AF37',
    fontSize: 11,
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#555',
  },
  orText: {
    color: '#aaa',
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: 'bold',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderColor: '#555',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#aaa',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;
