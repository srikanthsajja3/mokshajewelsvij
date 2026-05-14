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
import * as WebBrowser from 'expo-web-browser';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Allow the auth session to be completed
WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onGoHome: () => void;
  onClose: () => void;
  initialIsUpdatingPassword?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoHome, onClose, initialIsUpdatingPassword = false }) => {
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
      console.log(`Attempting ${isRegistering ? 'registration' : 'login'} for:`, email);
      
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          console.error('Registration Error:', error);
          throw error;
        }
        console.log('Registration successful:', data);
        setSuccessMessage("Success! Check your email for confirmation.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.error('Login Error:', error);
          throw error;
        }
        console.log('Login successful:', data.user?.id);
        setSuccessMessage("Sign in successful! Redirecting...");
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Authentication Catch:', error);
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
          // The redirect will be handled by the onAuthStateChange listener in AuthContext
          // or we can manually parse it if needed. Supabase usually handles this.
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
      Alert.alert('Error', 'Please enter your email address to reset your password.');
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccessMessage("Success! Reset link and code sent to your email.");
      setShowCodeEntry(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit code from your email.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await verifyOtp(email, otpCode);
      if (error) throw error;
      
      setSuccessMessage("Code verified! Please enter your new password.");
      setIsResetting(false);
      setShowCodeEntry(false);
      setIsUpdatingPassword(true);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid or expired code. Please try again.');
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
    setSuccessMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMessage("Password updated successfully! Redirecting...");
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header onPressLogo={onGoHome} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.title}>
                {isUpdatingPassword ? 'Reset Your Password' : isResetting ? 'Reset Password' : isRegistering ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isUpdatingPassword 
                  ? 'Enter a new password for your account'
                  : isResetting 
                  ? 'Enter your email to receive a reset link' 
                  : isRegistering 
                  ? 'Sign up to manage your orders and wishlist' 
                  : 'Sign in to access your luxury jewelry collection'}
              </Text>

              {successMessage ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {!isUpdatingPassword ? (
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
                    editable={!isUpdatingPassword}
                  />
                </View>
              ) : null}

              {!isResetting ? (
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
              ) : null}

              {!isRegistering && !isResetting && !isUpdatingPassword ? (
                <TouchableOpacity 
                  style={styles.forgotButton}
                  onPress={() => setIsResetting(true)}
                >
                  <Text style={styles.forgotButtonText}>Forgot Password?</Text>
                </TouchableOpacity>
              ) : null}

              {showCodeEntry && isResetting ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter code from email"
                    placeholderTextColor="#666"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Text style={styles.hintText}>If the link above expired, please enter the code manually here.</Text>
                </View>
              ) : null}

              <TouchableOpacity 
                style={styles.authButton}
                onPress={isUpdatingPassword ? handleUpdatePassword : showCodeEntry ? handleVerifyCode : isResetting ? handleReset : handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isUpdatingPassword ? 'Update Password' : showCodeEntry ? 'Verify Code' : isResetting ? 'Send Reset Link' : isRegistering ? 'Sign Up' : 'Sign In'}
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
                      disabled={isLoading}
                    >
                      <FontAwesome name="google" size={20} color="#fff" style={styles.socialIcon} />
                      <Text style={styles.socialButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    {Platform.OS !== 'android' && (
                      <TouchableOpacity 
                        style={[styles.socialButton, styles.appleButton]} 
                        onPress={() => handleSocialLogin('apple')}
                        disabled={isLoading}
                      >
                        <FontAwesome name="apple" size={20} color="#fff" style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Continue with Apple</Text>
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
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Footer />
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
  },
  contentWrapper: {
    flex: 1,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -10,
  },
  forgotButtonText: {
    color: '#D4AF37',
    fontSize: 12,
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#555',
  },
  orText: {
    color: '#aaa',
    paddingHorizontal: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  socialButtonsContainer: {
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
    marginRight: 10,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  hintText: {
    color: '#D4AF37',
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;
