// components/organisms/certificate/CertificateForm.tsx
import React, { useState, useEffect, HTMLAttributes, ChangeEvent } from 'react';
// import { useArweave } from '../../../contexts/ArweaveContext';
import { useCertificateContext } from '../../../contexts/CertificateContext';
import FormGroup from '../../molecules/forms/FormGroup';
import FormField from '../../molecules/forms/FormField';
import TextInput from '../../atoms/inputs/TextInput';
import DateInput from '../../atoms/inputs/DateInput';
import TextArea from '../../atoms/inputs/TextArea';
import Checkbox from '../../atoms/inputs/Checkbox';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import Modal from '../../molecules/modals/Modal';
// import PermanentStorageInfo from '../../molecules/storage/PermanentStorageInfo';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationIcon,
  InformationCircleIcon
} from '@heroicons/react/outline';

interface CertificateFormData {
  recipientName: string;
  recipientWallet: string;
  credentialTitle: string;
  issueDate: string;
  expiryDate: string;
  description: string;
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface CertificateResult {
  success: boolean;
  certificateId?: string;
  txHash?: string;
  arweaveTxId?: string;
  arweaveUri?: string;
  metadata?: any;
  error?: string;
}

interface CertificateFormProps extends HTMLAttributes<HTMLDivElement> {
  /** Issuer wallet address */
  walletAddress: string;
  /** Callback when certificate is issued */
  onIssued?: (result: CertificateResult) => void;
  /** Callback to initialize storage */
  onInitializeStorage?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Enhanced certificate form with AR.IO storage integration
 */
const CertificateForm: React.FC<CertificateFormProps> = ({
  walletAddress,
  onIssued,
  onInitializeStorage,
  className = '',
  ...props
}) => {
  // Form state
  const [formData, setFormData] = useState<CertificateFormData>({
    recipientName: '',
    recipientWallet: '',
    credentialTitle: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    termsAccepted: false,
  });

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [showStorageInfo, setShowStorageInfo] = useState(false);

  // Get contexts
  // const {
  //   isInitialized: isStorageReady,
  //   storeCertificate
  // } = useArweave();

  const {
    issueCertificate,
    isLoading,
    error: contextError
  } = useCertificateContext();

  // Initialize form with today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      issueDate: today,
    }));
  }, []);

  // Check storage status when component mounts
  // useEffect(() => {
  //   checkStorageStatus();
  // }, [checkStorageStatus]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error for this field when changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!formData.recipientWallet.trim()) {
      newErrors.recipientWallet = 'Recipient wallet address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipientWallet)) {
      newErrors.recipientWallet = 'Invalid Ethereum address format';
    }

    if (!formData.credentialTitle.trim()) {
      newErrors.credentialTitle = 'Credential title is required';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Add issuer wallet to form data
      const certificateData = {
        ...formData,
        certificateTitle: formData.credentialTitle,
        issuerWallet: walletAddress,
        issuerName: 'VeriChain Institution',
      };

      // Issue certificate on blockchain without Arweave storage
      const issuanceResult = await issueCertificate(certificateData);

      if (!issuanceResult.success) {
        throw new Error(issuanceResult.error || 'Failed to issue certificate on blockchain');
      }

      // Use blockchain result directly
      const finalResult = {
        ...issuanceResult,
      };

      // Set result and show modal
      setResult(finalResult);
      setShowResult(true);

      // Call onIssued callback if provided
      if (onIssued) {
        onIssued(finalResult);
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);

      // Show error in modal
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setShowResult(true);
    }
  };

  // Reset form after successful submission
  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      recipientName: '',
      recipientWallet: '',
      credentialTitle: '',
      issueDate: today,
      expiryDate: '',
      description: '',
      termsAccepted: false,
    });
    setErrors({});
  };

  // Close result modal
  const handleCloseResult = () => {
    setShowResult(false);

    // Reset form if successful
    if (result?.success) {
      resetForm();
    }
  };

  // Handle initialize storage click
  const handleInitializeStorage = () => {
    if (onInitializeStorage) {
      onInitializeStorage();
    }
  };

  return (
    <div className={className} {...props}>

      {/* Certificate Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormGroup title="Recipient Information" columns={2}>
          <FormField
            id="recipientName"
            label="Recipient Name"
            required
            error={errors.recipientName}
          >
            <TextInput
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Full name of the recipient"
              required
              error={errors.recipientName}
            />
          </FormField>

          <FormField
            id="recipientWallet"
            label="Recipient Wallet Address"
            required
            error={errors.recipientWallet}
          >
            <TextInput
              id="recipientWallet"
              name="recipientWallet"
              value={formData.recipientWallet}
              onChange={handleChange}
              placeholder="0x..."
              required
              error={errors.recipientWallet}
            />
          </FormField>
        </FormGroup>

        <FormGroup title="Credential Details" columns={3}>
          <FormField
            id="credentialTitle"
            label="Credential Title"
            required
            error={errors.credentialTitle}
          >
            <TextInput
              id="credentialTitle"
              name="credentialTitle"
              value={formData.credentialTitle}
              onChange={handleChange}
              placeholder="e.g., Bachelor of Computer Science"
              required
              error={errors.credentialTitle}
            />
          </FormField>

          <FormField
            id="issueDate"
            label="Issue Date"
            required
            error={errors.issueDate}
          >
            <DateInput
              id="issueDate"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              required
              error={errors.issueDate}
            />
          </FormField>

          <FormField
            id="expiryDate"
            label="Expiry Date (Optional)"
          >
            <DateInput
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </FormField>
        </FormGroup>

        <FormGroup title="Description">
          <FormField
            id="description"
            label="Credential Description"
          >
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Additional details about the credential..."
            />
          </FormField>
        </FormGroup>

        <FormField
          error={errors.termsAccepted}
        >
          <Checkbox
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            label="I confirm that I am authorized to issue this credential and that all information is accurate"
            required
          />
        </FormField>

        <div className="flex justify-end items-center pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isLoading ? 'Issuing Certificate...' : 'Issue Certificate'}
          </Button>
        </div>

        {contextError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
            {contextError}
          </p>
        )}
      </form>

      {/* Result Modal */}
      <Modal
        isOpen={showResult}
        onClose={handleCloseResult}
        title={result?.success ? "Certificate Issued" : "Issuance Failed"}
        size="lg"
      >
        {result?.success ? (
          <Card className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border-0 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
                  Certificate Issued Successfully
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <p className="mb-2">Your certificate has been successfully registered on the blockchain.</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="font-medium">Certificate ID:</p>
                      <p className="font-mono text-xs break-all">
                        {result.certificateId}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">Blockchain Transaction:</p>
                      <p className="font-mono text-xs break-all">
                        {result.txHash}
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href={`https://amoy.polygonscan.com/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary dark:text-primary-light hover:underline"
                      >
                        View on Polygon Amoy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border-0 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                  Certificate Issuance Failed
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>{result?.error || 'An unexpected error occurred while issuing the certificate.'}</p>

                  <div className="mt-4">
                    <p className="font-medium">Troubleshooting:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your blockchain wallet connection</li>
                      <li>Verify that the recipient address is valid</li>
                      <li>Ensure you have sufficient gas fees</li>
                      <li>Try again in a few moments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </Modal>

    </div>
  );
};

export default CertificateForm;