// components/atoms/display/Address.js
import React from 'react';

/**
 * Component for displaying blockchain addresses
 * 
 * @param {Object} props
 * @param {string} props.address - Blockchain address
 * @param {number} props.startLength - Number of characters to show at start
 * @param {number} props.endLength - Number of characters to show at end
 */
const Address = ({
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

