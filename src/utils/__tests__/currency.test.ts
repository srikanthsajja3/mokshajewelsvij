import { formatPrice } from '../currency';

describe('currency utility', () => {
  test('formats price in USD by default', () => {
    const result = formatPrice(100, 'US');
    // We use a regex to handle different whitespace characters that Intl might use
    expect(result).toMatch(/\$100/);
  });

  test('formats price in INR for country code IN', () => {
    const result = formatPrice(100, 'IN');
    // 100 * 83 = 8300
    expect(result).toMatch(/₹8,300/);
  });

  test('handles zero price', () => {
    const result = formatPrice(0, 'US');
    expect(result).toMatch(/\$0/);
  });
});
