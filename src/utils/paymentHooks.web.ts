import { Platform } from 'react-native';

export const usePaymentGateway = (countryCode: string) => {
  const isIndia = countryCode === 'IN';

  return {
    initPaymentSheet: async () => {
      console.log(`Payment initialization mocked on Web for ${isIndia ? 'Razorpay' : 'Stripe'}`);
      return { error: null };
    },
    
    presentPaymentSheet: async (params: any) => {
      return new Promise((resolve) => {
        const providerName = isIndia ? "Razorpay (India)" : "Stripe (International)";
        const amountStr = `${params?.amount || '0'} ${params?.currency || 'USD'}`;

        // Use standard browser confirmation for web reliability
        const confirmed = window.confirm(
          `${providerName} Simulation\n\nThis is a development simulation.\nAmount: ${amountStr}\n\nClick OK to simulate a Successful Payment.`
        );

        if (confirmed) {
          // Simulate a small network delay
          setTimeout(() => {
            resolve({ error: null });
          }, 1500);
        } else {
          resolve({ error: { code: 'Canceled', message: 'User canceled' } });
        }
      });
    },
    
    isAvailable: false,
    provider: isIndia ? 'razorpay' : 'stripe'
  };
};
