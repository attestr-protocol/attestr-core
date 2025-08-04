// components/atoms/display/Status.tsx
import React, { HTMLAttributes } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationIcon } from '@heroicons/react/outline';
import Badge from './Badge';

type StatusType = 'valid' | 'invalid' | 'expired' | 'revoked' | 'pending' | 'processing';
type StatusSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface StatusConfig {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  variant: BadgeVariant;
}

interface StatusProps extends HTMLAttributes<HTMLDivElement> {
  /** Status type */
  status?: StatusType;
  /** Whether to show status icon */
  showIcon?: boolean;
  /** Whether to show status label */
  showLabel?: boolean;
  /** Status size */
  size?: StatusSize;
  /** Additional CSS classes */
  className?: string;
}

const Status: React.FC<StatusProps> = ({
  status = 'valid',
  showIcon = true,
  showLabel = true,
  size = 'md',
  className = '',
  ...props
}) => {
  const statusConfig: Record<StatusType, StatusConfig> = {
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
  const iconSizes: Record<StatusSize, string> = {
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