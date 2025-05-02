// components/organisms/verification/VerificationForm.js
import React, { useState } from 'react';
import Button from '../../atoms/buttons/Button';
import TextInput from '../../atoms/inputs/TextInput';
import { useCertificateContext } from '../../../contexts/CertificateContext';

/**
 * Form for verifying certificates
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Submit callback
 * @param {boolean} props.isLoading - Whether verification is in progress
 */
const VerificationForm = ({
    onSubmit,
    isLoading = false,
    className = '',
    ...props
}) => {
    const [certificateId, setCertificateId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (certificateId.trim()) {
            onSubmit(certificateId.trim());
        }
    };

    return (
        <div className={`card ${className}`} {...props}>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <TextInput
                    id="certificateId"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Enter certificate ID or hash"
                    className="flex-grow"
                    required
                />
                <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="whitespace-nowrap"
                >
                    {isLoading ? 'Verifying...' : 'Verify Certificate'}
                </Button>
            </form>
        </div>
    );
};

export default VerificationForm;