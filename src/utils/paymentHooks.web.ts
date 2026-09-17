const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const usePaymentGateway = (countryCode: string) => {
  return {
    initPaymentSheet: async () => {
      await loadRazorpayScript();
      return { error: null };
    },
    
    presentPaymentSheet: async (params: { 
      amount: number; 
      currency?: string; 
      email?: string; 
      name?: string; 
      phone?: string; 
    }) => {
      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY;
      const loaded = await loadRazorpayScript();

      if (loaded && (window as any).Razorpay && razorpayKey) {
        return new Promise((resolve) => {
          const currency = params?.currency || (countryCode === 'IN' ? 'INR' : 'USD');
          const amountInSubunits = Math.round((params?.amount || 0) * 100);

          const options = {
            key: razorpayKey,
            amount: amountInSubunits,
            currency: currency,
            name: 'MOKSHA JEWELS',
            description: `Order Purchase (${currency} ${params?.amount || 0})`,
            image: 'https://i.imgur.com/3giU0H1.png',
            prefill: {
              name: params?.name || '',
              email: params?.email || '',
              contact: params?.phone || '',
            },
            theme: {
              color: '#D4AF37'
            },
            handler: function (response: any) {
              console.log('Razorpay International Web Payment Success:', response);
              resolve({ error: null, payment_id: response.razorpay_payment_id });
            },
            modal: {
              ondismiss: function () {
                resolve({ error: { code: 'Canceled', message: 'Payment canceled by user' } });
              }
            }
          };

          try {
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
              console.error('Razorpay Payment Error:', response.error);
              resolve({ 
                error: { 
                  code: 'Failed', 
                  message: response.error?.description || 'Payment processing failed' 
                } 
              });
            });
            rzp.open();
          } catch (err: any) {
            console.error('Error opening Razorpay checkout:', err);
            resolve({ error: { code: 'Error', message: err.message || 'Failed to open payment modal' } });
          }
        });
      }

      // Fallback simulation mode if key is not configured in .env yet
      return new Promise((resolve) => {
        const currency = params?.currency || (countryCode === 'IN' ? 'INR' : 'USD');
        const amountStr = `${params?.amount || '0'} ${currency}`;

        const confirmed = window.confirm(
          `Razorpay International Payment (${currency})\n\nAmount: ${amountStr}\nKey Status: ${razorpayKey ? 'Configured' : 'Missing EXPO_PUBLIC_RAZORPAY_KEY in .env'}\n\nClick OK to simulate a Successful Payment.`
        );

        if (confirmed) {
          setTimeout(() => {
            resolve({ error: null, payment_id: `pay_mock_${Date.now()}` });
          }, 1000);
        } else {
          resolve({ error: { code: 'Canceled', message: 'User canceled' } });
        }
      });
    },
    
    isAvailable: true,
    provider: 'razorpay'
  };
};
