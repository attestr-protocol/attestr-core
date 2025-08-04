import React, { ReactNode } from 'react';
import Button from './Button';

type IconPosition = 'left' | 'right';

interface ActionButtonProps {
  /** Icon component to display */
  icon?: ReactNode;
  /** Button label */
  label: string;
  /** Icon position */
  position?: IconPosition;
  /** Additional props passed to Button component */
  [key: string]: any;
}

const ActionButton: React.FC<ActionButtonProps> = ({
    icon,
    label,
    position = 'left',
    ...props
}) => {
    return (
        <Button {...props}>
            <div className="flex items-center justify-center">
                {position === 'left' && icon && (
                    <span className="mr-2">{icon}</span>
                )}
                {label}
                {position === 'right' && icon && (
                    <span className="ml-2">{icon}</span>
                )}
            </div>
        </Button>
    );
};

export default ActionButton;