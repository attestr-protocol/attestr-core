import { renderHook, act, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme, ThemeMode } from '../ThemeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

// Test component to test theme consumption
const TestComponent = () => {
  const { theme, darkMode, toggleDarkMode, setThemeMode, getColor } = useTheme();
  
  return (
    <div>
      <span data-testid="dark-mode">{darkMode.toString()}</span>
      <span data-testid="primary-color">{theme.colors.primary.DEFAULT}</span>
      <button onClick={toggleDarkMode} data-testid="toggle-btn">Toggle</button>
      <button onClick={() => setThemeMode('dark')} data-testid="set-dark-btn">Set Dark</button>
      <button onClick={() => setThemeMode('light')} data-testid="set-light-btn">Set Light</button>
      <span data-testid="get-color">{getColor('primary.DEFAULT')}</span>
      <span data-testid="get-invalid-color">{getColor('invalid.path') || 'null'}</span>
    </div>
  );
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Reset document.documentElement.classList mock
    document.documentElement.classList.add = jest.fn();
    document.documentElement.classList.remove = jest.fn();
  });

  test('provides initial theme context values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.darkMode).toBe(false);
    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.colors).toBeDefined();
    expect(result.current.theme.isDark).toBe(false);
    expect(typeof result.current.toggleDarkMode).toBe('function');
    expect(typeof result.current.setThemeMode).toBe('function');
    expect(typeof result.current.getColor).toBe('function');
  });

  test('toggles dark mode correctly', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Initially light mode
    expect(result.current.darkMode).toBe(false);

    // Toggle to dark mode
    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(true);
    expect(result.current.theme.isDark).toBe(true);

    // Toggle back to light mode
    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(false);
    expect(result.current.theme.isDark).toBe(false);
  });

  test('sets specific theme mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Set to dark mode
    act(() => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.darkMode).toBe(true);
    expect(result.current.theme.isDark).toBe(true);

    // Set to light mode
    act(() => {
      result.current.setThemeMode('light');
    });

    expect(result.current.darkMode).toBe(false);
    expect(result.current.theme.isDark).toBe(false);
  });

  test('getColor function works correctly', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Valid color path
    const primaryColor = result.current.getColor('primary.DEFAULT');
    expect(typeof primaryColor).toBe('string');

    // Invalid color path
    const invalidColor = result.current.getColor('invalid.path');
    expect(invalidColor).toBeNull();

    // Empty path
    const emptyPath = result.current.getColor('');
    expect(emptyPath).toBeNull();
  });

  test('initializes from localStorage dark theme', () => {
    // Mock localStorage to return dark theme
    mockLocalStorage.getItem = jest.fn((key) => {
      if (key === 'theme') return 'dark';
      return null;
    });
    
    // Mock localStorage.theme property
    Object.defineProperty(window.localStorage, 'theme', {
      value: 'dark',
      writable: true,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.darkMode).toBe(true);
  });

  test('initializes from system preference when no localStorage', () => {
    // Mock localStorage to return null
    mockLocalStorage.getItem = jest.fn(() => null);
    
    // Mock matchMedia to prefer dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.darkMode).toBe(true);
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  test('theme values change when mode changes', () => {
    render(<TestComponent />, { wrapper });

    // Get initial state (could be light or dark based on initialization)
    const initialDarkMode = screen.getByTestId('dark-mode').textContent;
    const initialPrimaryColor = screen.getByTestId('primary-color').textContent;

    // Toggle mode
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });

    // After toggle, mode should be different
    const newDarkMode = screen.getByTestId('dark-mode').textContent;
    expect(newDarkMode).not.toBe(initialDarkMode);
    
    // Primary color should be defined
    const newPrimaryColor = screen.getByTestId('primary-color').textContent;
    expect(newPrimaryColor).toBeDefined();
    expect(newPrimaryColor).not.toBe('');
  });

  test('getColor works with valid and invalid paths', () => {
    render(<TestComponent />, { wrapper });

    // Valid color path should return a color value
    const validColor = screen.getByTestId('get-color').textContent;
    expect(validColor).not.toBe('null');
    expect(validColor).not.toBe('');

    // Invalid color path should return null
    const invalidColor = screen.getByTestId('get-invalid-color').textContent;
    expect(invalidColor).toBe('null');
  });

  test('setThemeMode buttons work correctly', () => {
    render(<TestComponent />, { wrapper });

    // Set to dark mode
    act(() => {
      screen.getByTestId('set-dark-btn').click();
    });

    expect(screen.getByTestId('dark-mode')).toHaveTextContent('true');

    // Set to light mode
    act(() => {
      screen.getByTestId('set-light-btn').click();
    });

    expect(screen.getByTestId('dark-mode')).toHaveTextContent('false');
  });

  test('theme object has required properties', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    const { theme } = result.current;

    // Check that theme has expected structure
    expect(theme).toHaveProperty('colors');
    expect(theme).toHaveProperty('typography');
    expect(theme).toHaveProperty('spacing');
    expect(theme).toHaveProperty('borderRadius');
    expect(theme).toHaveProperty('boxShadow');
    expect(theme).toHaveProperty('transition');
    expect(theme).toHaveProperty('zIndex');
    expect(theme).toHaveProperty('isDark');

    // Check colors structure
    expect(theme.colors).toHaveProperty('primary');
    expect(theme.colors).toHaveProperty('secondary');
    expect(theme.colors).toHaveProperty('background');
    expect(theme.colors).toHaveProperty('text');
  });
});