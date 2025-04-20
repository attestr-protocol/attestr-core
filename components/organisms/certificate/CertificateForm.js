// components/organisms/certificate/CertificateForm.js
import React, { useState } from 'react';
import FormGroup from '../../molecules/forms/FormGroup';
import FormField from '../../molecules/forms/FormField';
import TextInput from '../../atoms/inputs/TextInput';
import DateInput from '../../atoms/inputs/DateInput';
import TextArea from '../../atoms/inputs/TextArea';
import Checkbox from '../../atoms/inputs/Checkbox';
import Button from '../../atoms/buttons/Button';

/**
 * Form for issuing a new certificate
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Submit callback
 * @param {boolean} props.isSubmitting - Whether form is submitting
 */
const CertificateForm = ({
  onSubmit,
  isSubmitting = false,
  className = '',
  ...props
}) => {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientWallet: '',
    credentialTitle: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={className} {...props}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormGroup columns={2}>
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
            error={errors.termsAccepted}
          />
        </FormField>

        <div className="text-center pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            fullWidth
            className="md:w-auto"
          >
            {isSubmitting ? 'Issuing Certificate...' : 'Issue Certificate'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CertificateForm;