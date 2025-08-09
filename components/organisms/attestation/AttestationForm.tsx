// components/organisms/attestation/AttestationForm.tsx
import React, { useState, useEffect } from 'react';
import { useAttestationContext } from '../../../contexts/AttestationContext';
import { useWalletContext } from '../../../contexts/WalletContext';
import { useSchemaService } from '../../../utils/attestation/useSchemaService';
import FormGroup from '../../molecules/forms/FormGroup';
import FormField from '../../molecules/forms/FormField';
import TextInput from '../../atoms/inputs/TextInput';
import DateInput from '../../atoms/inputs/DateInput';
import TextArea from '../../atoms/inputs/TextArea';
import Select from '../../atoms/inputs/Select';
import Checkbox from '../../atoms/inputs/Checkbox';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import Modal from '../../molecules/modals/Modal';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationIcon,
  InformationCircleIcon
} from '@heroicons/react/outline';

interface AttestationFormData {
  subjectAddress: string;
  subjectName: string;
  schemaId: string;
  attestationTitle: string;
  description: string;
  expiryDate?: string;
  customData: Record<string, any>;
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface AttestationResult {
  success: boolean;
  attestationId?: string;
  txHash?: string;
  error?: string;
}

interface AttestationFormProps {
  /** Callback when attestation is created */
  onCreated?: (result: AttestationResult) => void;
  /** Initial schema ID to pre-select */
  initialSchemaId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Comprehensive attestation creation form with schema-driven field generation
 */
const AttestationForm: React.FC<AttestationFormProps> = ({
  onCreated,
  initialSchemaId,
  className = ''
}) => {
  // Context hooks
  const { createAttestation, isLoading, error: contextError } = useAttestationContext();
  const { address: attesterAddress } = useWalletContext();
  const { getSchemas, getSchemaById, getTemplate } = useSchemaService();

  // Form state
  const [formData, setFormData] = useState<AttestationFormData>({
    subjectAddress: '',
    subjectName: '',
    schemaId: initialSchemaId || '',
    attestationTitle: '',
    description: '',
    expiryDate: '',
    customData: {},
    termsAccepted: false,
  });

  // State for schemas and validation
  const [availableSchemas, setAvailableSchemas] = useState<any[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AttestationResult | null>(null);
  const [schemaFields, setSchemaFields] = useState<any[]>([]);

  // Load available schemas on mount
  useEffect(() => {
    loadSchemas();
  }, []);

  // Load schema details when schemaId changes
  useEffect(() => {
    if (formData.schemaId) {
      loadSchemaDetails(formData.schemaId);
    }
  }, [formData.schemaId]);

  const loadSchemas = async () => {
    try {
      const schemas = await getSchemas();
      setAvailableSchemas(schemas.filter(schema => schema.active));
    } catch (error) {
      console.error('Error loading schemas:', error);
    }
  };

  const loadSchemaDetails = async (schemaId: string) => {
    try {
      const template = await getTemplate(schemaId);
      if (template) {
        setSelectedSchema(template.schema);
        setSchemaFields(template.fields);
        
        // Initialize custom data based on schema fields
        const initialCustomData: Record<string, any> = {};
        template.fields.forEach((field: any) => {
          initialCustomData[field.name] = field.defaultValue || '';
        });
        setFormData(prev => ({ ...prev, customData: initialCustomData }));
      }
    } catch (error) {
      console.error('Error loading schema details:', error);
    }
  };

  // Handle form field changes
  const handleFieldChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle custom field changes based on schema
  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customData: {
        ...prev.customData,
        [fieldName]: value
      }
    }));

    // Clear error for this field
    const errorKey = `customData.${fieldName}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.subjectAddress.trim()) {
      newErrors.subjectAddress = 'Subject address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.subjectAddress)) {
      newErrors.subjectAddress = 'Invalid Ethereum address format';
    }

    if (!formData.subjectName.trim()) {
      newErrors.subjectName = 'Subject name is required';
    }

    if (!formData.schemaId) {
      newErrors.schemaId = 'Schema selection is required';
    }

    if (!formData.attestationTitle.trim()) {
      newErrors.attestationTitle = 'Attestation title is required';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms';
    }

    // Schema field validation
    if (schemaFields && schemaFields.length > 0) {
      schemaFields.forEach((field: any) => {
        if (field.required) {
          const value = formData.customData[field.name];
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors[`customData.${field.name}`] = `${field.label} is required`;
          }
        }
      });
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

    if (!attesterAddress) {
      setResult({
        success: false,
        error: 'Wallet not connected'
      });
      setShowResult(true);
      return;
    }

    try {
      // Prepare attestation data
      const attestationData = {
        attesterName: 'Attestr Protocol Institution',
        subjectName: formData.subjectName,
        attestationTitle: formData.attestationTitle,
        description: formData.description,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: formData.expiryDate,
        attesterWallet: attesterAddress,
        subjectWallet: formData.subjectAddress,
        schemaId: formData.schemaId,
        customData: formData.customData
      };

      // Create attestation
      const createResult = await createAttestation(attestationData);

      const finalResult: AttestationResult = {
        success: createResult.success,
        attestationId: createResult.attestationId,
        txHash: createResult.txHash,
        error: createResult.error
      };

      // Set result and show modal
      setResult(finalResult);
      setShowResult(true);

      // Call onCreated callback if provided
      if (onCreated) {
        onCreated(finalResult);
      }

    } catch (error) {
      console.error('Error creating attestation:', error);

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
    setFormData({
      subjectAddress: '',
      subjectName: '',
      schemaId: initialSchemaId || '',
      attestationTitle: '',
      description: '',
      expiryDate: '',
      customData: {},
      termsAccepted: false,
    });
    setErrors({});
    setSchemaFields([]);
  };

  // Close result modal
  const handleCloseResult = () => {
    setShowResult(false);
    if (result?.success) {
      resetForm();
    }
  };

  // Render schema-specific fields
  const renderSchemaFields = () => {
    if (!schemaFields.length) return null;

    return (
      <FormGroup title="Schema-Specific Data" columns={2}>
        {schemaFields.map((field: any) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            required={field.required}
            error={errors[`customData.${field.name}`]}
            helpText={field.description}
          >
            {field.type === 'text' && (
              <TextInput
                id={field.name}
                name={field.name}
                value={formData.customData[field.name] || ''}
                onChange={(value) => handleCustomFieldChange(field.name, value)}
                placeholder={field.placeholder}
                required={field.required}
                error={errors[`customData.${field.name}`]}
              />
            )}
            {field.type === 'textarea' && (
              <TextArea
                id={field.name}
                name={field.name}
                value={formData.customData[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 3}
              />
            )}
            {field.type === 'select' && (
              <Select
                id={field.name}
                name={field.name}
                value={formData.customData[field.name] || ''}
                onChange={(value) => handleCustomFieldChange(field.name, value)}
                options={field.options || []}
                placeholder={field.placeholder}
                required={field.required}
                error={errors[`customData.${field.name}`]}
              />
            )}
            {field.type === 'date' && (
              <DateInput
                id={field.name}
                name={field.name}
                value={formData.customData[field.name] || ''}
                onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                required={field.required}
                error={errors[`customData.${field.name}`]}
              />
            )}
          </FormField>
        ))}
      </FormGroup>
    );
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Information */}
        <FormGroup title="Subject Information" columns={2}>
          <FormField
            id="subjectName"
            label="Subject Name"
            required
            error={errors.subjectName}
          >
            <TextInput
              id="subjectName"
              name="subjectName"
              value={formData.subjectName}
              onChange={(value) => handleFieldChange('subjectName', value)}
              placeholder="Full name of the subject"
              required
              error={errors.subjectName}
            />
          </FormField>

          <FormField
            id="subjectAddress"
            label="Subject Wallet Address"
            required
            error={errors.subjectAddress}
          >
            <TextInput
              id="subjectAddress"
              name="subjectAddress"
              value={formData.subjectAddress}
              onChange={(value) => handleFieldChange('subjectAddress', value)}
              placeholder="0x..."
              required
              error={errors.subjectAddress}
            />
          </FormField>
        </FormGroup>

        {/* Schema Selection */}
        <FormGroup title="Attestation Schema" columns={1}>
          <FormField
            id="schemaId"
            label="Schema"
            required
            error={errors.schemaId}
            helpText="Select the schema that defines the structure of this attestation"
          >
            <Select
              id="schemaId"
              name="schemaId"
              value={formData.schemaId}
              onChange={(value) => handleFieldChange('schemaId', value)}
              options={availableSchemas.map(schema => ({
                value: schema.id,
                label: schema.name,
                description: schema.description
              }))}
              placeholder="Choose an attestation schema..."
              required
              error={errors.schemaId}
            />
          </FormField>
        </FormGroup>

        {/* Attestation Details */}
        <FormGroup title="Attestation Details" columns={2}>
          <FormField
            id="attestationTitle"
            label="Attestation Title"
            required
            error={errors.attestationTitle}
          >
            <TextInput
              id="attestationTitle"
              name="attestationTitle"
              value={formData.attestationTitle}
              onChange={(value) => handleFieldChange('attestationTitle', value)}
              placeholder="e.g., Bachelor of Computer Science Degree"
              required
              error={errors.attestationTitle}
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
              onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
            />
          </FormField>
        </FormGroup>

        {/* Schema-specific fields */}
        {renderSchemaFields()}

        {/* Description */}
        <FormGroup title="Additional Information">
          <FormField
            id="description"
            label="Description"
            helpText="Additional context or details about this attestation"
          >
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={4}
              placeholder="Provide additional details about this attestation..."
            />
          </FormField>
        </FormGroup>

        {/* Terms */}
        <FormField error={errors.termsAccepted}>
          <Checkbox
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={(checked) => handleFieldChange('termsAccepted', checked)}
            label="I confirm that I am authorized to issue this attestation and that all information is accurate"
            required
          />
        </FormField>

        <div className="flex justify-end items-center pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !attesterAddress}
            isLoading={isLoading}
          >
            {isLoading ? 'Creating Attestation...' : 'Create Attestation'}
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
        title={result?.success ? "Attestation Created" : "Creation Failed"}
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
                  Attestation Created Successfully
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <p className="mb-2">Your attestation has been successfully registered on the blockchain.</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="font-medium">Attestation ID:</p>
                      <p className="font-mono text-xs break-all">
                        {result.attestationId}
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
                  Attestation Creation Failed
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>{result?.error || 'An unexpected error occurred while creating the attestation.'}</p>

                  <div className="mt-4">
                    <p className="font-medium">Troubleshooting:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your wallet connection</li>
                      <li>Verify that the subject address is valid</li>
                      <li>Ensure you have sufficient gas fees</li>
                      <li>Verify the schema is active and valid</li>
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

export default AttestationForm;