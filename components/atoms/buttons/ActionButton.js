import React from 'react';
import Button from './Button';

/**
 * Button with an icon
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.label - Button label
 * @param {string} props.position - Icon position ('left' or 'right')
 */
const ActionButton = ({
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