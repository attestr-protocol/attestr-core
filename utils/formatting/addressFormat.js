/**
 * Format a blockchain address for display
 * 
 * @param {string} address - Blockchain address
 * @param {number} startChars - Number of characters to show at the start
 * @param {number} endChars - Number of characters to show at the end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, startChars = 6, endChars = 4) => {
    if (!address) {
        return '';
    }

    if (address.length <= startChars + endChars) {
        return address;
    }

    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};