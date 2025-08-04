// components/molecules/cards/InfoCard.tsx
import React from 'react';
import Card from './Card';

type CardVariant = 'default' | 'flat' | 'outline' | 'colored';
type CardColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

interface InfoCardProps {
    /** Card title */
    title: string;
    /** Icon component */
    icon?: React.ReactNode;
    /** Card content */
    children?: React.ReactNode;
    /** Card footer */
    footer?: React.ReactNode;
    /** Card variant (passed to Card component) */
    variant?: CardVariant;
    /** Card color (passed to Card component) */
    color?: CardColor;
    /** Whether to add hover effect */
    hover?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Additional props passed to Card */
    [key: string]: any;
}

/**
 * Information card with title and optional icon
 */
const InfoCard: React.FC<InfoCardProps> = ({
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