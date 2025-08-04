// components/molecules/modals/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { XIcon } from '@heroicons/react/outline';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  className?: string;
  [key: string]: any;
}

/**
 * Modal component for displaying content in a dialog
 */
const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
    ...props
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && onClose) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Handle clicking outside modal to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen && onClose) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // If modal is not open, don't render
    if (!isOpen) {
        return null;
    }

    // Size classes
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        full: 'max-w-full',
    };

    const modalSizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            {/* Modal container */}
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                {/* Modal content */}
                <div
                    ref={modalRef}
                    className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-light text-left shadow-xl transition-all sm:my-8 ${modalSizeClass} w-full ${className}`}
                    {...props}
                >
                    {/* Modal header */}
                    {title && (
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            {onClose && (
                                <button
                                    type="button"
                                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <XIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Modal body */}
                    <div className={title ? 'px-6 py-4' : 'p-6'}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;