import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

export const StripeWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return (
    <StripeProvider
      publishableKey="pk_test_51TD1fdPpy7SI5aki9zxkji1kI88kQtZ0ecUuChWq1l2YCc4E2w94eH5UXPS6GNQ8lf7zTzR9xxMU69qsUne462jr00SZxdcHVw" // REPLACE WITH YOUR STRIPE PUBLISHABLE KEY
      merchantIdentifier="merchant.com.mokshajewels"
    >
      {children}
    </StripeProvider>
  );
};
