// components/molecules/cards/InfoCard.js
import React from 'react';

/**
 * Information card with title and optional icon
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.icon - Icon component
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.footer - Card footer
 */
const InfoCard = ({
    title,
    icon,
    children,
    footer,
    className = '',
    ...props
}) => {
    const cardClasses = [
        'card',
        className
    ].join(' ');

    return (
        <div className={cardClasses} {...props}>
            {(title || icon) && (
                <div className="flex items-center mb-4">
                    {icon && (
                        <div className="mr-3 text-primary">
                            {icon}
                        </div>
                    )}
                    {title && (
                        <h3 className="text-xl font-bold">{title}</h3>
                    )}
                </div>
            )}

            <div>
                {children}
            </div>

            {footer && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default InfoCard;

