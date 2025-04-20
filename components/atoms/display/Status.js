// components/atoms/display/Status.js
import React from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/outline';

/**
 * Status component for certificate validation
 * 
 * @param {Object} props
 * @param {string} props.status - 'valid', 'invalid', 'expired', 'revoked'
 */
const Status = ({
  status = 'valid',
  className = '',
  showIcon = true,
  showLabel = true,
  ...props
}) => {
  const statusConfig = {
    valid: {
      icon: CheckCircleIcon,
      color: 'text-green-500',
      label: 'Valid',
    },
    invalid: {
      icon: XCircleIcon,
      color: 'text-red-500',
      label: 'Invalid',
    },
    expired: {
      icon: ClockIcon,
      color: 'text-yellow-500',
      label: 'Expired',
    },
    revoked: {
      icon: XCircleIcon,
      color: 'text-red-500',
      label: 'Revoked',
    },
    pending: {
      icon: ClockIcon,
      color: 'text-blue-500',
      label: 'Pending',
    },
  };
  
  const config = statusConfig[status] || statusConfig.valid;
  const StatusIcon = config.icon;
  
  return (
    <div className={`flex items-center ${className}`} {...props}>
      {showIcon && <StatusIcon className={`h-5 w-5 ${config.color} mr-2`} />}
      {showLabel && <span className={`font-medium ${config.color}`}>{config.label}</span>}
    </div>
  );
};

export default Status;

