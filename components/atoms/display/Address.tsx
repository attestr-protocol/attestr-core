// components/atoms/display/Address.tsx
import React, { HTMLAttributes } from 'react';

interface AddressProps extends HTMLAttributes<HTMLSpanElement> {
  /** Blockchain address */
  address: string;
  /** Number of characters to show at start */
  startLength?: number;
  /** Number of characters to show at end */
  endLength?: number;
  /** Whether to show full address */
  isFull?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const Address: React.FC<AddressProps> = ({
    address,
    startLength = 6,
    endLength = 4,
    isFull = false,
    className = '',
    ...props
}) => {
    if (!address) {
        return null;
    }

    const formattedAddress = isFull
        ? address
        : `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;

    const addressClasses = [
        'font-mono',
        className
    ].join(' ');

    return (
        <span className={addressClasses} {...props}>
            {formattedAddress}
        </span>
    );
};

export default Address;

