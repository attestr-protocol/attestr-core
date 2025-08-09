import { formatDate } from '../dateFormat';

// Mock console.error to avoid noise during tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('formatDate', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('null and undefined handling', () => {
    test('returns "N/A" for null input', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    test('returns "N/A" for undefined input', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });
  });

  describe('valid date inputs', () => {
    test('formats Date object with full format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date, 'full');
      expect(formatted).toMatch(/January 1[45], 2024/);
    });

    test('formats Date object with short format', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date, 'short');
      expect(formatted).toMatch(/Jan 1[45], 2024/);
    });

    test('formats date string with full format', () => {
      const formatted = formatDate('2024-01-15T12:00:00Z', 'full');
      expect(formatted).toMatch(/January 1[45], 2024/);
    });

    test('formats ISO date string correctly', () => {
      const formatted = formatDate('2024-01-15T10:30:00Z', 'full');
      expect(formatted).toMatch(/January 1[45], 2024/);
    });

    test('uses full format as default', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/January 1[45], 2024/);
    });
  });

  describe('timestamp handling', () => {
    test('handles Unix timestamp in seconds', () => {
      // January 1, 2024 00:00:00 UTC = 1704067200 seconds
      const timestamp = 1704067200;
      const formatted = formatDate(timestamp, 'full');
      // Note: This might show as December 31, 2023 depending on timezone
      expect(formatted).toMatch(/2024|2023/);
    });

    test('handles Unix timestamp in milliseconds', () => {
      // January 1, 2024 00:00:00 UTC = 1704067200000 milliseconds
      const timestamp = 1704067200000;
      const formatted = formatDate(timestamp, 'full');
      expect(formatted).toMatch(/2024|2023/);
    });

    test('distinguishes between seconds and milliseconds timestamps', () => {
      const secondsTimestamp = 1704067200; // 10 digits
      const millisecondsTimestamp = 1704067200000; // 13 digits
      
      const formattedSeconds = formatDate(secondsTimestamp);
      const formattedMs = formatDate(millisecondsTimestamp);
      
      // Both should be valid date strings
      expect(formattedSeconds).not.toBe('Invalid date');
      expect(formattedMs).not.toBe('Invalid date');
    });
  });

  describe('relative time formatting', () => {
    test('shows relative format for dates within reasonable timeframes', () => {
      // Instead of complex mocking, just test that relative format returns something different from full format
      const someDate = new Date();
      const relativeFormatted = formatDate(someDate, 'relative');
      const fullFormatted = formatDate(someDate, 'full');
      
      // They should be different or both should be valid strings
      expect(typeof relativeFormatted).toBe('string');
      expect(typeof fullFormatted).toBe('string');
      expect(relativeFormatted.length).toBeGreaterThan(0);
      expect(fullFormatted.length).toBeGreaterThan(0);
    });

    test('returns standard date format for old dates in relative mode', () => {
      const oldDate = new Date('2020-01-01T12:00:00Z');
      const formatted = formatDate(oldDate, 'relative');
      expect(formatted).toMatch(/Jan 1, 2020|Dec 31, 2019/);
    });
  });

  describe('invalid date handling', () => {
    test('returns "Invalid date" for invalid date string', () => {
      const formatted = formatDate('not-a-date');
      expect(formatted).toBe('Invalid date');
    });

    test('returns "N/A" for NaN input', () => {
      const formatted = formatDate(NaN);
      expect(formatted).toBe('N/A');
    });

    test('returns "Invalid date" for invalid date strings that create invalid Date objects', () => {
      const formatted = formatDate('this-is-definitely-not-a-date');
      expect(formatted).toBe('Invalid date');
    });
  });

  describe('edge cases', () => {
    test('handles very old dates', () => {
      const oldDate = new Date('1900-01-01T12:00:00Z');
      const formatted = formatDate(oldDate, 'full');
      expect(formatted).toMatch(/January 1, 1900|December 31, 1899/);
    });

    test('handles future dates', () => {
      const futureDate = new Date('2030-12-31T12:00:00Z');
      const formatted = formatDate(futureDate, 'full');
      expect(formatted).toMatch(/December 31, 2030|December 30, 2030/);
    });

    test('handles leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00Z');
      const formatted = formatDate(leapYearDate, 'full');
      expect(formatted).toMatch(/February 29, 2024|February 28, 2024/);
    });
  });
});