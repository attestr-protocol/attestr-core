// components/molecules/forms/DynamicForm.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { FormField, ValidationRule, AttestationData } from '../../../contexts/types';
import TextInput from '../../atoms/inputs/TextInput';
import TextArea from '../../atoms/inputs/TextArea';
import DateInput from '../../atoms/inputs/DateInput';
import Checkbox from '../../atoms/inputs/Checkbox';
import Button from '../../atoms/buttons/Button';

interface DynamicFormProps {
    fields: FormField[];
    initialData?: AttestationData;
    onSubmit: (data: AttestationData) => void;
    onCancel?: () => void;
    isLoading?: boolean;
    className?: string;
}

interface FormErrors {
    [fieldName: string]: string[];
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
    fields,
    initialData = {},
    onSubmit,
    onCancel,
    isLoading = false,
    className = ''
}) => {
    const [formData, setFormData] = useState<AttestationData>(initialData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Validate a single field
    const validateField = useCallback((field: FormField, value: any): string[] => {
        const fieldErrors: string[] = [];

        if (!field.validation) return fieldErrors;

        for (const rule of field.validation) {
            switch (rule.type) {
                case 'required':
                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'min':
                    if (typeof value === 'number' && value < rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'max':
                    if (typeof value === 'number' && value > rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'minLength':
                    if (typeof value === 'string' && value.length < rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'maxLength':
                    if (typeof value === 'string' && value.length > rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'pattern':
                    if (typeof value === 'string' && rule.value && !new RegExp(rule.value).test(value)) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'email':
                    if (typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'url':
                    if (typeof value === 'string' && value) {
                        try {
                            new URL(value);
                        } catch {
                            fieldErrors.push(rule.message);
                        }
                    }
                    break;
            }
        }

        return fieldErrors;
    }, []);

    // Validate all fields
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        fields.forEach(field => {
            const fieldErrors = validateField(field, formData[field.name]);
            if (fieldErrors.length > 0) {
                newErrors[field.name] = fieldErrors;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [fields, formData, validateField]);

    // Handle field value change
    const handleFieldChange = useCallback((fieldName: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Real-time validation for touched fields
        if (touched[fieldName]) {
            const field = fields.find(f => f.name === fieldName);
            if (field) {
                const fieldErrors = validateField(field, value);
                setErrors(prev => ({
                    ...prev,
                    [fieldName]: fieldErrors
                }));
            }
        }
    }, [fields, touched, validateField]);

    // Handle field blur (mark as touched)
    const handleFieldBlur = useCallback((fieldName: string) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: true
        }));

        // Validate field on blur
        const field = fields.find(f => f.name === fieldName);
        if (field) {
            const fieldErrors = validateField(field, formData[fieldName]);
            setErrors(prev => ({
                ...prev,
                [fieldName]: fieldErrors
            }));
        }
    }, [fields, formData, validateField]);

    // Handle form submission
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        
        // Mark all fields as touched
        const allTouched = fields.reduce((acc, field) => ({
            ...acc,
            [field.name]: true
        }), {});
        setTouched(allTouched);

        if (validateForm()) {
            onSubmit(formData);
        }
    }, [fields, formData, validateForm, onSubmit]);

    // Render field based on type
    const renderField = useCallback((field: FormField) => {
        const value = formData[field.name] ?? field.defaultValue ?? '';
        const fieldErrors = errors[field.name] || [];
        const hasError = fieldErrors.length > 0 && touched[field.name];

        const commonProps = {
            id: field.name,
            name: field.name,
            label: field.label,
            value,
            onChange: (newValue: any) => handleFieldChange(field.name, newValue),
            onBlur: () => handleFieldBlur(field.name),
            error: hasError ? fieldErrors[0] : undefined,
            helpText: field.description,
            required: field.required,
            className: 'w-full'
        };

        switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
                return (
                    <TextInput
                        {...commonProps}
                        type={field.type}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );

            case 'textarea':
                return (
                    <TextArea
                        {...commonProps}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={4}
                    />
                );

            case 'number':
                const numField = field as any;
                return (
                    <TextInput
                        {...commonProps}
                        type="number"
                        min={numField.validation?.find((r: ValidationRule) => r.type === 'min')?.value}
                        max={numField.validation?.find((r: ValidationRule) => r.type === 'max')?.value}
                        step={numField.step || 'any'}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );

            case 'date':
                return (
                    <DateInput
                        {...commonProps}
                    />
                );

            case 'datetime':
                return (
                    <TextInput
                        {...commonProps}
                        type="datetime-local"
                    />
                );

            case 'select':
                return (
                    <div className="w-full">
                        <label 
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            id={field.name}
                            name={field.name}
                            value={value}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            onBlur={() => handleFieldBlur(field.name)}
                            required={field.required}
                            className={`
                                block w-full px-3 py-2 border rounded-md shadow-sm
                                bg-white dark:bg-gray-700 
                                border-gray-300 dark:border-gray-600
                                text-gray-900 dark:text-gray-100
                                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
                            `}
                        >
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {field.options?.map((option) => (
                                <option 
                                    key={option.value} 
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {field.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                            </p>
                        )}
                        {hasError && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors[0]}
                            </p>
                        )}
                    </div>
                );

            case 'multiselect':
                return (
                    <div className="w-full">
                        <label 
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            id={field.name}
                            name={field.name}
                            multiple
                            value={Array.isArray(value) ? value : []}
                            onChange={(e) => {
                                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                                handleFieldChange(field.name, selectedValues);
                            }}
                            onBlur={() => handleFieldBlur(field.name)}
                            required={field.required}
                            className={`
                                block w-full px-3 py-2 border rounded-md shadow-sm
                                bg-white dark:bg-gray-700 
                                border-gray-300 dark:border-gray-600
                                text-gray-900 dark:text-gray-100
                                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
                            `}
                            size={Math.min(field.options?.length || 3, 6)}
                        >
                            {field.options?.map((option) => (
                                <option 
                                    key={option.value} 
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Hold Ctrl/Cmd to select multiple options
                        </p>
                        {field.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                            </p>
                        )}
                        {hasError && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors[0]}
                            </p>
                        )}
                    </div>
                );

            case 'radio':
                return (
                    <div className="w-full">
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </legend>
                            <div className="space-y-2">
                                {field.options?.map((option) => (
                                    <label 
                                        key={option.value}
                                        className="flex items-center cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name={field.name}
                                            value={option.value}
                                            checked={value === option.value}
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                            onBlur={() => handleFieldBlur(field.name)}
                                            disabled={option.disabled}
                                            className="mr-2 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {field.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                            </p>
                        )}
                        {hasError && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors[0]}
                            </p>
                        )}
                    </div>
                );

            case 'checkbox':
                return (
                    <Checkbox
                        id={field.name}
                        name={field.name}
                        label={field.label}
                        checked={!!value}
                        onChange={(checked) => handleFieldChange(field.name, checked)}
                        onBlur={() => handleFieldBlur(field.name)}
                        helpText={field.description}
                        error={hasError ? fieldErrors[0] : undefined}
                    />
                );

            case 'file':
                return (
                    <div className="w-full">
                        <label 
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                            type="file"
                            id={field.name}
                            name={field.name}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                handleFieldChange(field.name, file);
                            }}
                            onBlur={() => handleFieldBlur(field.name)}
                            required={field.required}
                            className={`
                                block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-blue-900 dark:file:text-blue-300
                                dark:hover:file:bg-blue-800
                                ${hasError ? 'border-red-500' : ''}
                            `}
                        />
                        {field.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                            </p>
                        )}
                        {hasError && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors[0]}
                            </p>
                        )}
                    </div>
                );

            case 'address':
                return (
                    <TextInput
                        {...commonProps}
                        type="text"
                        placeholder="0x..."
                        pattern="^0x[a-fA-F0-9]{40}$"
                    />
                );

            default:
                return (
                    <TextInput
                        {...commonProps}
                        type="text"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
        }
    }, [formData, errors, touched, handleFieldChange, handleFieldBlur]);

    // Check if form has errors
    const hasFormErrors = useMemo(() => {
        return Object.values(errors).some(fieldErrors => fieldErrors.length > 0);
    }, [errors]);

    return (
        <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
            <div className="grid grid-cols-1 gap-6">
                {fields.map((field) => (
                    <div key={field.name}>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading || hasFormErrors}
                >
                    {isLoading ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </form>
    );
};

export default DynamicForm;