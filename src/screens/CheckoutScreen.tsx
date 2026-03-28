import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useCart } from '../contexts/CartContext';
import { useCountry } from '../contexts/CountryContext';
import { formatPrice } from '../utils/currency';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePaymentGateway } from '../utils/paymentHooks';
interface CheckoutScreenProps {
  onGoHome: () => void;
  onSuccess: () => void;
  onPressLogin: () => void;
  onPressOrders: () => void;
  onPressCart: () => void;
  onPressWishlist: () => void;
  onPressProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = (props) => {
  const { onGoHome, onSuccess, onPressLogin, onPressOrders, onPressCart } = props;
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const { initPaymentSheet, presentPaymentSheet, isAvailable, provider } = usePaymentGateway(countryCode);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(Platform.OS === 'web' || countryCode === 'IN');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Form State - Shipping
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('United States');

  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const fetchSavedAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Auto-select default address
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) {
        handleSelectAddress(defaultAddr);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.full_name);
    setAddress(addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ''));
    setCity(addr.city);
    setZip(addr.zip_code);
    setCountry(addr.country);
  };

  const fetchPaymentSheetParams = async () => {
    // If we're on web, don't call the edge function for Stripe
    if (Platform.OS === 'web') {
      return { paymentIntent: 'mock', ephemeralKey: 'mock', customer: 'mock' };
    }

    const { data, error } = await supabase.functions.invoke('payment-sheet', {
      body: { amount: Math.round(cartTotal * 100) }, // Amount in cents
    });

    if (error) {
      console.error('Error fetching payment sheet params:', error);
      throw error;
    }

    return data;
  };

  const initializePaymentSheet = async () => {
    if (!user) return;

    try {
      const {
        paymentIntent,
        ephemeralKey,
        customer,
      } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Moksha Jewels",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: user.email,
        }
      });

      if (!error) {
        setIsReady(true);
      }
    } catch (e) {
      console.error('Error initializing payment sheet:', e);
    }
  };

  useEffect(() => {
    // Only initialize Stripe's PaymentSheet if we are using Stripe
    if (user && cartTotal > 0 && provider === 'stripe') {
      initializePaymentSheet();
    }
  }, [user, cartTotal, provider]);

  const handlePayment = async () => {
    if (!fullName || !address || !city || !zip || !country) {
      Alert.alert("Shipping Required", "Please enter your full delivery address and destination country.");
      return;
    }

    if (!user) {
      Alert.alert("Authentication Required", "Please log in to complete your order.");
      onPressLogin();
      return;
    }

    if (!isReady) {
      Alert.alert("Payment Not Ready", "We are still setting up the secure payment session. Please try again in a moment.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Choose parameters based on provider
      const paymentParams = provider === 'razorpay' ? {
        amount: cartTotal,
        currency: countryCode === 'IN' ? 'INR' : 'USD',
        email: user.email
      } : undefined;

      const { error } = await presentPaymentSheet(paymentParams as any);

      if (error) {
        if (error.code === 'Canceled') {
          // User canceled
        } else {
          Alert.alert(`Error`, error.message);
        }
        setIsProcessing(false);
        return;
      }

      // 3. Create the Order in Supabase after successful payment
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          shipping_address: address,
          city: city,
          zip_code: zip,
          shipping_country: country,
          address_id: selectedAddressId,
          status: 'paid'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Insert Order Items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 5. Success Flow
      await clearCart();
      setIsProcessing(false);
      
      Alert.alert(
        "Payment Successful", 
        `Your masterpiece will be shipped to ${country}. Thank you for shopping with Moksha Jewels!`,
        [{ text: "View Order History", onPress: () => onSuccess() }]
      );
    } catch (error: any) {
      console.error('Payment Error:', error.message);
      setIsProcessing(false);
      Alert.alert("Transaction Failed", "The payment could not be processed. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header {...props} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Secure Checkout</Text>

            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>SELECT SAVED ADDRESS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressList}>
                  {savedAddresses.map((addr) => (
                    <TouchableOpacity 
                      key={addr.id} 
                      style={[styles.addressCard, selectedAddressId === addr.id && styles.selectedAddressCard]}
                      onPress={() => handleSelectAddress(addr)}
                    >
                      <Text style={styles.addressLabel}>{addr.label.toUpperCase()}</Text>
                      <Text style={styles.addressName}>{addr.full_name}</Text>
                      <Text style={styles.addressCountry}>{addr.country}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity 
                    style={styles.addressCard}
                    onPress={() => {
                      setSelectedAddressId(null);
                      setFullName('');
                      setAddress('');
                      setCity('');
                      setZip('');
                      setCountry('United States');
                    }}
                  >
                    <Text style={[styles.addressLabel, { color: '#D4AF37' }]}>+ NEW</Text>
                    <Text style={styles.addressName}>Enter New Address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            ) : null}

            {/* Shipping Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>1. SHIPPING ADDRESS</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Receiver's Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#666"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street Address, Apt/Suite"
                  placeholderTextColor="#666"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="New York"
                    placeholderTextColor="#666"
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>ZIP / Postal</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10001"
                    placeholderTextColor="#666"
                    value={zip}
                    onChangeText={setZip}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Destination Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="United States, India, UAE..."
                  placeholderTextColor="#666"
                  value={country}
                  onChangeText={setCountry}
                />
              </View>
            </View>

            {/* Summary Section */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Review Order</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{cart.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping to:</Text>
                <Text style={styles.summaryValue}>{country}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery:</Text>
                <Text style={styles.summaryValue}>Complimentary</Text>
              </View>
              <View style={[styles.summaryRow, styles.finalTotal]}>
                <Text style={styles.totalLabel}>Grand Total:</Text>
                <Text style={styles.totalValue}>{formatPrice(cartTotal, countryCode)}</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.payButton, 
                  (isProcessing || !isReady) && styles.payButtonDisabled
                ]} 
                onPress={handlePayment}
                disabled={isProcessing || !isReady}
              >
                {isProcessing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#000" size="small" />
                    <Text style={styles.payButtonTextDisabled}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.payButtonText}>
                    {isReady ? "Authorize Payment" : "Preparing Gateway..."}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.encryptionNote}>🔒 Powered by {provider === 'razorpay' ? 'Razorpay' : 'Stripe'}. All transactions are end-to-end encrypted.</Text>
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
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 26,
    color: '#D4AF37',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 2,
  },
  addressList: {
    gap: 15,
    paddingBottom: 10,
  },
  addressCard: {
    backgroundColor: '#3d2b1a',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 8,
    padding: 15,
    width: 180,
  },
  selectedAddressCard: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  addressLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addressName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressCountry: {
    color: '#aaa',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#888',
    fontSize: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: '#3d2b1a',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 6,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  encryptionNote: {
    color: '#666',
    fontSize: 10,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryBox: {
    backgroundColor: '#3d2b1a',
    borderRadius: 12,
    padding: 25,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'TrajanPro',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  finalTotal: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#4a3520',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 25,
  },
  payButtonDisabled: {
    backgroundColor: '#9a7b1c',
    opacity: 0.7,
  },
  payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  payButtonTextDisabled: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});

export default CheckoutScreen;
