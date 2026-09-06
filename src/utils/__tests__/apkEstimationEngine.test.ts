import { fetchServerApkEstimate, calculateApkEstimate } from '../apkEstimationEngine';
import { supabase } from '../../../supabase';

jest.mock('../../../supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('Server-Authoritative Estimation Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns default zeroed estimate when calculateApkEstimate is called (client-side calculation disabled)', () => {
    const res = calculateApkEstimate();
    expect(res.totalEstimateUSD).toBe(0);
    expect(res.goldValue).toBe(0);
  });

  test('fetches server estimate via calculate_product_estimate_json RPC', async () => {
    const mockEstimate = {
      goldRate: 13981.0,
      billingWeight: 12.0,
      goldValue: 167772.0,
      stoneItems: [],
      totalStoneValue: 0,
      totalDiamondCarats: 0,
      certCharges: 0,
      labourCharges: 5500,
      labourType: 'Weight Based',
      subTotal: 173272,
      gstAmount: 5198,
      totalEstimate: 178470,
      totalEstimateUSD: 2150.24,
    };

    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: mockEstimate,
      error: null,
    });

    const res = await fetchServerApkEstimate({
      netWt: 10.0,
      purity: '22K',
      wastagePct: 20.0,
    });

    expect(supabase.rpc).toHaveBeenCalledWith('calculate_product_estimate_json', {
      p_input: {
        netWt: 10.0,
        purity: '22K',
        wastagePct: 20.0,
      },
    });

    expect(res).toEqual(mockEstimate);
    expect(res.goldValue).toBe(167772.0);
    expect(res.totalEstimateUSD).toBe(2150.24);
  });

  test('handles Supabase RPC error during server estimation', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database RPC connection failed' },
    });

    await expect(
      fetchServerApkEstimate({
        netWt: 5.0,
        purity: '18K',
      })
    ).rejects.toThrow('Server calculation failed: Database RPC connection failed');
  });
});
