import { Alert, Platform } from 'react-native';

// Use a safer way to import native modules to prevent startup crashes in Expo Go
let useStripe: any = () => ({ initPaymentSheet: () => {}, presentPaymentSheet: () => {} });
let RazorpayCheckout: any = null;

if (Platform.OS !== 'web') {
  try {
    // Attempt to require the native modules
    const StripeModule = require('@stripe/stripe-react-native');
    useStripe = StripeModule.useStripe;
    
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch (e) {
    console.warn("Native payment modules not found. Payments will only work in a Development Build.");
  }
}

export const usePaymentGateway = (countryCode: string) => {
  const isIndia = countryCode === 'IN';
  
  // Initialize stripe hook (only works if module exists)
  let stripeHook: any = { initPaymentSheet: async () => {}, presentPaymentSheet: async () => {} };
  try {
    stripeHook = useStripe();
  } catch (e) {}

  // 1. Stripe Handler
  const handleStripePayment = async () => {
    if (!stripeHook.presentPaymentSheet) {
      Alert.alert("Development Build Required", "Stripe is not available in Expo Go. Please use a Development Build.");
      return { error: { code: 'Unavailable', message: 'Module not found' } };
    }
    const { error } = await stripeHook.presentPaymentSheet();
    return { error };
  };

  // 2. Razorpay Handler
  const handleRazorpayPayment = async (params: { 
    amount: number; 
    currency: string; 
    email: string; 
  }) => {
    if (!RazorpayCheckout) {
      Alert.alert("Development Build Required", "Razorpay is not available in Expo Go. Please use a Development Build.");
      return { error: { code: 'Unavailable', message: 'Module not found' } };
    }
    try {
      const options = {
        description: 'Moksha Jewels Purchase',
        image: 'https://i.imgur.com/3giU0H1.png',
        currency: params.currency || 'INR',
        key: 'rzp_test_placeholder', 
        amount: Math.round(params.amount * 100),
        name: 'MOKSHA JEWELS',
        prefill: { email: params.email },
        theme: { color: '#D4AF37' }
      };
      const data = await RazorpayCheckout.open(options);
      return { error: null, payment_id: data.razorpay_payment_id };
    } catch (error: any) {
      return { error: { code: 'Failed', message: error.description || 'Payment failed' } };
    }
  };

  return {
    initPaymentSheet: isIndia ? async () => ({ error: null }) : stripeHook.initPaymentSheet,
    presentPaymentSheet: isIndia ? handleRazorpayPayment : handleStripePayment,
    isAvailable: Platform.OS === 'web' ? false : (!!RazorpayCheckout || !!stripeHook.presentPaymentSheet),
    provider: isIndia ? 'razorpay' : 'stripe'
  };
};
