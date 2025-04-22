// components/molecules/cards/InfoCard.js
import React from 'react';
import Card from './Card';

/**
 * Information card with title and optional icon
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.icon - Icon component
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.footer - Card footer
 * @param {string} props.variant - Card variant (passed to Card component)
 * @param {string} props.color - Card color (passed to Card component)
 * @param {boolean} props.hover - Whether to add hover effect
 */
const InfoCard = ({
    title,
    icon,
    children,
    footer,
    variant = 'default',
    color = 'primary',
    hover = true,
    className = '',
    ...props
}) => {
    return (
        <Card
            variant={variant}
            color={color}
            hover={hover}
            className={className}
            {...props}
        >
            {(title || icon) && (
                <div className="flex items-center mb-4">
                    {icon && (
                        <div className={`mr-3 text-${color} dark:text-${color}-light`}>
                            {icon}
                        </div>
                    )}
                    {title && (
                        <h3 className="text-xl font-bold">{title}</h3>
                    )}
                </div>
            )}

            <div className="mb-4">
                {children}
            </div>

            {footer && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {footer}
                </div>
            )}
        </Card>
    );
};

export default InfoCard;