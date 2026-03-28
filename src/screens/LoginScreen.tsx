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
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onGoHome: () => void;
  onClose: () => void;
  initialIsUpdatingPassword?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onGoHome, onClose, initialIsUpdatingPassword = false }) => {
  const { resetPassword, setIsRecovering } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
      setSuccessMessage("Success! Reset link sent to your email.");
      setTimeout(() => {
        setIsResetting(false);
        setSuccessMessage("");
      }, 3000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link.');
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

              <TouchableOpacity 
                style={styles.authButton}
                onPress={isUpdatingPassword ? handleUpdatePassword : isResetting ? handleReset : handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isUpdatingPassword ? 'Update Password' : isResetting ? 'Send Reset Link' : isRegistering ? 'Sign Up' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

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
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#aaa',
    fontSize: 14,
    textDecorationLine: 'underline',
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
