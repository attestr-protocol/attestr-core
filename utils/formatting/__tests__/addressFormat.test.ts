import { formatAddress } from '../addressFormat';

describe('formatAddress', () => {
  test('formats standard Ethereum address correctly', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const formatted = formatAddress(address);
    expect(formatted).toBe('0x1234...7890');
  });

  test('formats address with custom start and end character counts', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const formatted = formatAddress(address, 8, 6);
    expect(formatted).toBe('0x123456...567890');
  });

  test('returns full address when shorter than startChars + endChars', () => {
    const shortAddress = '0x12345';
    const formatted = formatAddress(shortAddress);
    expect(formatted).toBe('0x12345');
  });

  test('returns empty string for null address', () => {
    const formatted = formatAddress(null);
    expect(formatted).toBe('');
  });

  test('returns empty string for undefined address', () => {
    const formatted = formatAddress(undefined);
    expect(formatted).toBe('');
  });

  test('returns empty string for empty string address', () => {
    const formatted = formatAddress('');
    expect(formatted).toBe('');
  });

  test('handles edge case where address equals startChars + endChars', () => {
    const address = '0x12345678'; // 10 characters, default is 6 + 4 = 10
    const formatted = formatAddress(address);
    expect(formatted).toBe('0x12345678');
  });

  test('works with non-Ethereum addresses', () => {
    const bitcoinAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const formatted = formatAddress(bitcoinAddress);
    expect(formatted).toBe('1A1zP1...vfNa');
  });

  test('handles very long addresses', () => {
    const longAddress = '0x' + '1'.repeat(100);
    const formatted = formatAddress(longAddress);
    expect(formatted).toBe('0x1111' + '...' + '1111');
  });

  test('works with different startChars and endChars values', () => {
    const address = '0x1234567890123456789012345678901234567890';
    
    const formatted1 = formatAddress(address, 4, 2);
    expect(formatted1).toBe('0x12...90');
    
    const formatted2 = formatAddress(address, 10, 8);
    expect(formatted2).toBe('0x12345678...34567890');
  });

  test('handles zero startChars or endChars', () => {
    const address = '0x1234567890123456789012345678901234567890';
    
    const formatted1 = formatAddress(address, 0, 4);
    expect(formatted1).toBe('...7890');
    
    const formatted2 = formatAddress(address, 6, 0);
    expect(formatted2).toBe('0x1234...');
  });
});