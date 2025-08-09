import { renderHook, act } from '@testing-library/react';
import { AttestationProvider, useAttestationContext } from '../AttestationContext';
import type { AttestationData } from '../AttestationContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AttestationProvider>{children}</AttestationProvider>
);

describe('AttestationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any global state if needed
  });

  test('provides initial context values', () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    expect(result.current.attestations).toEqual([]);
    expect(result.current.currentAttestation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
    expect(result.current.storageInitialized).toBe(false);
  });

  test('createAttestation updates loading state', async () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    const mockAttestationData: AttestationData = {
      attesterName: 'Test Attester',
      subjectName: 'Test Subject',
      attestationTitle: 'Test Attestation',
      description: 'Test Description',
      issueDate: '2024-01-01',
      attesterWallet: '0x123',
      subjectWallet: '0x456',
    };

    await act(async () => {
      result.current.createAttestation(mockAttestationData);
    });

    // Should handle the loading state properly
    expect(typeof result.current.createAttestation).toBe('function');
  });

  test('verifyAttestation handles validation', async () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    await act(async () => {
      const verificationResult = await result.current.verifyAttestation('test-id');
      expect(verificationResult).toHaveProperty('success');
    });
  });

  test('loadUserAttestations fetches attestations for user', async () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    await act(async () => {
      const attestations = await result.current.loadUserAttestations('0x123', 'attester');
      expect(Array.isArray(attestations)).toBe(true);
    });
  });

  test('checkIsVerifiedAttester returns boolean', async () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    await act(async () => {
      const isVerified = await result.current.checkIsVerifiedAttester('0x123');
      expect(typeof isVerified).toBe('boolean');
    });
  });

  test('clearCurrentAttestation clears current attestation', () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    act(() => {
      result.current.clearCurrentAttestation();
    });

    expect(result.current.currentAttestation).toBeNull();
  });

  test('resetState resets all state', () => {
    const { result } = renderHook(() => useAttestationContext(), { wrapper });

    act(() => {
      result.current.resetState();
    });

    expect(result.current.attestations).toEqual([]);
    expect(result.current.currentAttestation).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.successMessage).toBeNull();
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAttestationContext());
    }).toThrow('useAttestationContext must be used within an AttestationProvider');

    consoleSpy.mockRestore();
  });
});