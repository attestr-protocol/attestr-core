// components/atoms/display/Status.js
import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationIcon } from '@heroicons/react/outline';
import Badge from './Badge';

/**
 * Status component for certificate validation
 * 
 * @param {Object} props
 * @param {string} props.status - 'valid', 'invalid', 'expired', 'revoked', 'pending'
 * @param {boolean} props.showIcon - Whether to show status icon
 * @param {boolean} props.showLabel - Whether to show status label
 * @param {string} props.size - 'sm', 'md' (default), 'lg'
 */
const Status = ({
  status = 'valid',
  showIcon = true,
  showLabel = true,
  size = 'md',
  className = '',
  ...props
}) => {
  const statusConfig = {
    valid: {
      icon: CheckCircleIcon,
      label: 'Valid',
      variant: 'success',
    },
    invalid: {
      icon: XCircleIcon,
      label: 'Invalid',
      variant: 'error',
    },
    expired: {
      icon: ClockIcon,
      label: 'Expired',
      variant: 'warning',
    },
    revoked: {
      icon: XCircleIcon,
      label: 'Revoked',
      variant: 'error',
    },
    pending: {
      icon: ClockIcon,
      label: 'Pending',
      variant: 'info',
    },
    processing: {
      icon: ExclamationIcon,
      label: 'Processing',
      variant: 'info',
    },
  };

  const config = statusConfig[status] || statusConfig.valid;
  const StatusIcon = config.icon;

  // Icon size based on the size prop
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = iconSizes[size] || iconSizes.md;

  if (showLabel) {
    return (
      <Badge
        variant={config.variant}
        text={(
          <span className="flex items-center">
            {showIcon && <StatusIcon className={`${iconSize} mr-1.5`} />}
            {config.label}
          </span>
        )}
        size={size}
        className={className}
        {...props}
      />
    );
  }

  // Just the icon
  return showIcon ? (
    <div className={`flex items-center ${className}`} {...props}>
      <StatusIcon className={`${iconSize} text-${config.variant}`} />
    </div>
  ) : null;
};

export default Status;