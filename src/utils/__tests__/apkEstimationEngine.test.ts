import { calculateApkEstimate, DEFAULT_MASTER_RATES } from '../apkEstimationEngine';

describe('APK Estimation Calculation Engine', () => {
  test('calculates gold value using billing weight formula', () => {
    const res = calculateApkEstimate({
      netWt: 10.0,
      purity: '22K',
      wastagePct: 20.0,
    }, DEFAULT_MASTER_RATES);

    // Billing weight = 10 * (1 + 0.20) = 12.0g
    expect(res.billingWeight).toBe(12.0);
    // Gold value = 12.0 * 13981.00 = 167772
    expect(res.goldValue).toBe(167772.00);
    expect(res.goldRate).toBe(13981.00);
  });

  test('applies Special D Tier 1 Labour Override for diamond items <= 5.2g', () => {
    const res = calculateApkEstimate({
      productCode: 'DBR19',
      netWt: 2.19,
      purity: '18K',
      stones: [{ name: 'Diamond (VVS-EF-RD)', weight: 0.05, rate: 69000 }]
    }, DEFAULT_MASTER_RATES);

    expect(res.labourCharges).toBe(10000); // Fixed tier 1
    expect(res.labourType).toBe('Tier Override');
    expect(res.certCharges).toBe(950); // Min cert charge for diamonds
  });

  test('applies Special D Tier 2 Labour Override for diamond items between 5.2g and 8.0g', () => {
    const res = calculateApkEstimate({
      productCode: 'DTPS70',
      netWt: 6.5,
      purity: '18K',
    }, DEFAULT_MASTER_RATES);

    expect(res.labourCharges).toBe(12000); // Fixed tier 2
    expect(res.labourType).toBe('Tier Override');
  });

  test('applies Emerald & Ruby discount rule for non-diamond products', () => {
    const res = calculateApkEstimate({
      productCode: 'GBG32', // Starts with G (Gold product)
      netWt: 40.45,
      purity: '22K',
      stones: [
        { name: 'RUBY', weight: 3.02, rate: 3500 },
        { name: 'EMERALD', weight: 0.90, rate: 2500 }
      ]
    }, DEFAULT_MASTER_RATES);

    // Ruby base rate 3500 - 1000 discount = 2500/ct * 3.02 = 7550
    const ruby = res.stoneItems.find(s => s.name === 'RUBY');
    expect(ruby?.discount).toBe(1000);
    expect(ruby?.finalRate).toBe(2500);
    expect(ruby?.amount).toBe(7550);

    // Emerald base rate 2500 - 1000 discount = 1500/ct * 0.90 = 1350
    const emerald = res.stoneItems.find(s => s.name === 'EMERALD');
    expect(emerald?.discount).toBe(1000);
    expect(emerald?.finalRate).toBe(1500);
    expect(emerald?.amount).toBe(1350);
  });

  test('does NOT apply Emerald & Ruby discount rule for diamond products starting with D', () => {
    const res = calculateApkEstimate({
      productCode: 'DPNT264', // Starts with D (Diamond product)
      netWt: 13.964,
      purity: '18K',
      stones: [
        { name: 'EMERALD', weight: 1.96, rate: 2500 }
      ]
    }, DEFAULT_MASTER_RATES);

    const emerald = res.stoneItems.find(s => s.name === 'EMERALD');
    expect(emerald?.discount).toBe(0);
    expect(emerald?.finalRate).toBe(2500);
  });

  test('calculates admin profit/loss analysis correctly', () => {
    const res = calculateApkEstimate({
      netWt: 10.0,
      purity: '22K',
      wastagePct: 25.0,
      purchaseCost: 150000
    }, DEFAULT_MASTER_RATES);

    expect(res.purchaseCost).toBe(150000);
    expect(res.estimatedProfit).toBe(res.totalEstimate - 150000);
    expect(res.isLoss).toBe(false);
  });
});
