require('@testing-library/jest-dom');

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
    };
  },
}));

// Mock Web3 providers
global.window = global.window || {};
global.window.ethereum = {
  isMetaMask: true,
  selectedAddress: '0x1234567890123456789012345678901234567890',
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock document.documentElement.classList
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn(),
  }
});

// Mock attestation service methods
jest.mock('./utils/attestation/attestationService', () => ({
  attestationService: {
    issueAttestation: jest.fn().mockResolvedValue({
      success: true,
      attestationId: 'test-attestation-id',
      txHash: '0xtest-tx-hash'
    }),
    verifyAttestation: jest.fn().mockResolvedValue({
      isValid: true,
      attestation: {
        id: 'test-id',
        attester: '0x123',
        subject: '0x456',
        schema: 'test-schema',
        data: {}
      }
    }),
    getAttestationsForAttester: jest.fn().mockResolvedValue([
      {
        id: 'test-1',
        attester: '0x123',
        subject: '0x456',
        schema: 'test-schema',
        data: {}
      }
    ]),
    getAttestationsForSubject: jest.fn().mockResolvedValue([
      {
        id: 'test-2',
        attester: '0x789',
        subject: '0x456',
        schema: 'test-schema',
        data: {}
      }
    ]),
  },
}));