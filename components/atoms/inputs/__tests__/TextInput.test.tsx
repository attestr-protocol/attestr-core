import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/contexts/ThemeContext';
import TextInput from '../TextInput';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('TextInput Component', () => {
  const defaultProps = {
    id: 'test-input',
    name: 'testInput',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input with correct props', () => {
    renderWithTheme(
      <TextInput {...defaultProps} placeholder="Enter text" />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testInput');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  test('calls onChange with value when input changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    renderWithTheme(
      <TextInput {...defaultProps} onChange={handleChange} />
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');
    
    expect(handleChange).toHaveBeenCalledTimes(5); // One for each character
    expect(handleChange).toHaveBeenLastCalledWith('Hello');
  });

  test('displays label when provided', () => {
    renderWithTheme(
      <TextInput {...defaultProps} label="Test Label" />
    );
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  test('displays error state correctly', () => {
    renderWithTheme(
      <TextInput {...defaultProps} error="This field is required" />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('displays help text', () => {
    renderWithTheme(
      <TextInput {...defaultProps} helpText="Enter your full name" />
    );
    
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  test('handles different input types', () => {
    renderWithTheme(
      <TextInput {...defaultProps} type="email" />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  test('shows required indicator', () => {
    renderWithTheme(
      <TextInput {...defaultProps} label="Required Field" required />
    );
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('handles disabled state', () => {
    renderWithTheme(
      <TextInput {...defaultProps} disabled />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('handles number input with min/max', () => {
    renderWithTheme(
      <TextInput 
        {...defaultProps} 
        type="number" 
        min={0} 
        max={100}
      />
    );
    
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  test('calls onBlur when input loses focus', () => {
    const handleBlur = jest.fn();
    
    renderWithTheme(
      <TextInput {...defaultProps} onBlur={handleBlur} />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });
});