// utils/services/arweaveCertificateService.js
import Arweave from 'arweave';
import {
    buildCertificateQuery,
    buildProfileQuery,
    buildCertificateSearchQuery,
    executeQuery
} from '../arweave/graphqlQueries';
import {
    retrieveCertificateMetadata,
    formatCertificateMetadata,
    getGatewayUrl
} from '../storage/arweaveStorage';

// Initialize Arweave with configurable host
const arweave = Arweave.init({
    host: process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'arweave.net',
    port: 443,
    protocol: 'https',
    timeout: 20000,
    logging: false,
});

/**
 * Service class for certificate operations on Arweave
 */
class ArweaveCertificateService {
    /**
     * Get certificates for a user (either as issuer or recipient)
     * @param {string} walletAddress - User's wallet address
     * @param {string} role - 'issuer' or 'recipient'
     * @param {number} limit - Maximum number of certificates to retrieve
     * @returns {Promise<Array>} Array of certificate objects
     */
    async getUserCertificates(walletAddress, role = 'recipient', limit = 100) {
        try {
            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            // Build query based on role
            const queryOptions = {
                first: limit,
                tags: [],
            };

            if (role === 'issuer') {
                queryOptions.owners = [walletAddress];
            } else if (role === 'recipient') {
                queryOptions.tags.push({ name: 'Recipient', values: [walletAddress] });
            } else {
                throw new Error('Invalid role. Must be "issuer" or "recipient"');
            }

            const query = buildCertificateQuery(queryOptions);
            const result = await executeQuery(query);

            if (!result.data || !result.data.transactions || !result.data.transactions.edges) {
                return [];
            }

            // Process results
            return await Promise.all(
                result.data.transactions.edges.map(async (edge) => {
                    const { node } = edge;
                    const certificate = this._processCertificateNode(node);

                    // Try to get metadata if available
                    try {
                        certificate.metadata = await retrieveCertificateMetadata(`ar://${node.id}`);
                    } catch (error) {
                        console.warn(`Failed to retrieve metadata for certificate ${node.id}:`, error);
                    }

                    return certificate;
                })
            );
        } catch (error) {
            console.error('Error getting user certificates:', error);
            throw error;
        }
    }

    /**
     * Search for certificates by text
     * @param {string} searchText - Text to search for
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} Array of certificate objects
     */
    async searchCertificates(searchText, limit = 20) {
        try {
            if (!searchText || searchText.trim().length < 3) {
                throw new Error('Search text must be at least 3 characters');
            }

            const query = buildCertificateSearchQuery(searchText, limit);
            const result = await executeQuery(query);

            if (!result.data || !result.data.transactions || !result.data.transactions.edges) {
                return [];
            }

            // Process results
            return result.data.transactions.edges.map(edge => {
                return this._processCertificateNode(edge.node);
            });
        } catch (error) {
            console.error('Error searching certificates:', error);
            throw error;
        }
    }

    /**
     * Get a certificate by its transaction ID
     * @param {string} txId - Arweave transaction ID
     * @returns {Promise<Object>} Certificate object with metadata
     */
    async getCertificate(txId) {
        try {
            if (!txId) {
                throw new Error('Transaction ID is required');
            }

            // First try to get metadata
            let metadata = null;
            try {
                metadata = await retrieveCertificateMetadata(`ar://${txId}`);
            } catch (error) {
                console.warn(`Failed to retrieve metadata for certificate ${txId}:`, error);
            }

            // Get transaction details from GraphQL
            const query = {
                query: `
          query {
            transaction(id: "${txId}") {
              id
              owner {
                address
              }
              tags {
                name
                value
              }
              block {
                height
                timestamp
              }
            }
          }
        `,
            };

            const result = await executeQuery(query);

            if (!result.data || !result.data.transaction) {
                throw new Error(`Certificate with ID ${txId} not found`);
            }

            // Process the transaction
            const certificate = this._processCertificateNode(result.data.transaction);
            certificate.metadata = metadata;

            return certificate;
        } catch (error) {
            console.error(`Error getting certificate ${txId}:`, error);
            throw error;
        }
    }

    /**
     * Create a certificate and store it on Arweave
     * @param {Object} certificateData - Certificate data
     * @param {Object} wallet - Arweave wallet JWK
     * @returns {Promise<Object>} Created certificate with transaction details
     */
    async createCertificate(certificateData, wallet) {
        try {
            if (!wallet) {
                throw new Error('Wallet is required to create certificates');
            }

            // Format metadata
            const metadata = formatCertificateMetadata(certificateData);

            // Create transaction
            const transaction = await arweave.createTransaction({
                data: JSON.stringify(metadata, null, 2),
            }, wallet);

            // Add tags
            transaction.addTag('Content-Type', 'application/json');
            transaction.addTag('App-Name', 'VeriChain');
            transaction.addTag('Type', 'Certificate');
            transaction.addTag('Certificate-Title', metadata.credential.title);
            transaction.addTag('Issuer', metadata.issuer.name);
            transaction.addTag('Recipient', metadata.recipient.wallet);

            // Sign transaction
            await arweave.transactions.sign(transaction, wallet);

            // Submit transaction
            const response = await arweave.transactions.post(transaction);

            if (response.status !== 200 && response.status !== 202) {
                throw new Error(`Failed to submit transaction: ${response.statusText}`);
            }

            return {
                success: true,
                txId: transaction.id,
                arweaveUri: `ar://${transaction.id}`,
                metadata,
            };
        } catch (error) {
            console.error('Error creating certificate:', error);
            throw error;
        }
    }

    /**
     * Process a certificate node from GraphQL results
     * @param {Object} node - Transaction node from GraphQL
     * @returns {Object} Processed certificate object
     * @private
     */
    _processCertificateNode(node) {
        // Extract issuer address
        const issuer = node.owner.address;

        // Extract recipient from tags
        const recipientTag = node.tags?.find(tag => tag.name === 'Recipient');
        const recipient = recipientTag ? recipientTag.value : null;

        // Extract title from tags
        const titleTag = node.tags?.find(tag => tag.name === 'Certificate-Title');
        const title = titleTag ? titleTag.value : 'Untitled Certificate';

        // Extract timestamp if available
        const timestamp = node.block?.timestamp
            ? new Date(node.block.timestamp * 1000).toISOString()
            : null;

        return {
            id: node.id,
            issuer,
            recipient,
            title,
            timestamp,
            blockHeight: node.block?.height,
            viewUrl: getGatewayUrl(node.id),
            arweaveUri: `ar://${node.id}`,
        };
    }
}

// Export a singleton instance
export const arweaveCertificateService = new ArweaveCertificateService();