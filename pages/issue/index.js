import Head from 'next/head';
import { useState } from 'react';

export default function IssueCertificate() {
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientWallet: '',
        credentialTitle: '',
        issueDate: '',
        expiryDate: '',
        description: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // This will be connected to blockchain functionality later
        console.log('Certificate data to issue:', formData);
        alert('Certificate issuance functionality will be implemented in the next phase');
    };

    return (
        <div>
            <Head>
                <title>Issue Certificate | VeriChain</title>
                <meta name="description" content="Issue new blockchain-verified credentials" />
            </Head>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">Issue New Certificate</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Create and issue a new blockchain-verified credential for an individual.
                </p>
            </div>

            <div className="card max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Recipient Name
                            </label>
                            <input
                                type="text"
                                id="recipientName"
                                name="recipientName"
                                value={formData.recipientName}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="recipientWallet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Recipient Wallet Address
                            </label>
                            <input
                                type="text"
                                id="recipientWallet"
                                name="recipientWallet"
                                value={formData.recipientWallet}
                                onChange={handleChange}
                                placeholder="0x..."
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="credentialTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Credential Title
                            </label>
                            <input
                                type="text"
                                id="credentialTitle"
                                name="credentialTitle"
                                value={formData.credentialTitle}
                                onChange={handleChange}
                                placeholder="e.g., Bachelor of Computer Science"
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                id="issueDate"
                                name="issueDate"
                                value={formData.issueDate}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Expiry Date (Optional)
                            </label>
                            <input
                                type="date"
                                id="expiryDate"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Credential Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="input"
                            placeholder="Additional details about the credential..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            required
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            I confirm that I am authorized to issue this credential and that all information is accurate
                        </label>
                    </div>

                    <div className="text-center pt-4">
                        <button type="submit" className="btn-primary w-full md:w-auto">
                            Issue Certificate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}