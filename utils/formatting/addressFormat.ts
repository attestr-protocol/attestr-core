/**
 * Format a blockchain address for display
 * 
 * @param address - Blockchain address
 * @param startChars - Number of characters to show at the start
 * @param endChars - Number of characters to show at the end
 * @returns Formatted address
 */
export const formatAddress = (
  address: string | null | undefined, 
  startChars: number = 6, 
  endChars: number = 4
): string => {
  if (!address) {
    return '';
  }

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};