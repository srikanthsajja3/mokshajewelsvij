/**
 * Utility to format price based on country code.
 * Base prices in PRODUCTS are assumed to be in USD.
 */
export const formatPrice = (price: number, countryCode: string): string => {
  const exchangeRate = 80; // 1 USD = 80 INR (Approx)
  
  if (countryCode === 'IN') {
    const inrPrice = price * exchangeRate;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(inrPrice);
  }

  // Default to USD for other countries
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};
