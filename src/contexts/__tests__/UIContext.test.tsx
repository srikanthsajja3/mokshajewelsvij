import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { UIProvider, useUI } from '../UIContext';

describe('UIContext', () => {
  it('initializes with default values', async () => {
    const { result } = await renderHook(() => useUI(), { wrapper: UIProvider });
    expect(result.current.loginVisible).toBe(false);
    expect(result.current.drawerVisible).toBe(false);
    expect(result.current.scrollY).toBeDefined();
  });

  it('updates loginVisible', async () => {
    const { result } = await renderHook(() => useUI(), { wrapper: UIProvider });
    await act(async () => {
      result.current.setLoginVisible(true);
    });
    expect(result.current.loginVisible).toBe(true);
  });

  it('updates drawerVisible', async () => {
    const { result } = await renderHook(() => useUI(), { wrapper: UIProvider });
    await act(async () => {
      result.current.setDrawerVisible(true);
    });
    expect(result.current.drawerVisible).toBe(true);
  });
});
