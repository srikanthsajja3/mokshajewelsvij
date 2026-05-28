import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";

export const StripeWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <StripeProvider
      publishableKey={STRIPE_KEY}
      merchantIdentifier="merchant.com.mokshajewels"
    >
      {children}
    </StripeProvider>
  );
};
