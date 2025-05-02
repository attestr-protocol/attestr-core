// utils/arweave/graphqlQueries.js

/**
 * Build a GraphQL query to fetch VeriChain certificates
 * @param {Object} options - Query options
 * @param {number} options.first - Number of results to return (default: 100, max: 100)
 * @param {Array} options.tags - Array of tag objects with name and value(s)
 * @param {Array} options.owners - Array of wallet addresses
 * @param {Array} options.recipients - Array of recipient wallet addresses
 * @param {string} options.after - Cursor for pagination
 * @returns {Object} GraphQL query object
 */
export function buildCertificateQuery({
    first = 100,
    tags = [],
    owners = [],
    recipients = [],
    after = null
} = {}) {
    // Start with standard tags that identify VeriChain certificates
    const defaultTags = [
        { name: 'App-Name', values: ['VeriChain'] },
        { name: 'Type', values: ['Certificate'] },
    ];

    // Combine default tags with any user-provided tags
    const allTags = [...defaultTags, ...tags];

    // Add recipient tags if provided
    if (recipients && recipients.length > 0) {
        allTags.push({ name: 'Recipient', values: recipients });
    }

    // Build the tags filter
    const tagsFilter = allTags.map(tag => {
        return `{ name: "${tag.name}", values: [${tag.values.map(v => `"${v}"`).join(', ')}] }`;
    }).join(', ');

    // Build owners filter if provided
    const ownersFilter = owners && owners.length > 0
        ? `owners: [${owners.map(owner => `"${owner}"`).join(', ')}]`
        : '';

    // Add after cursor for pagination if provided
    const afterFilter = after ? `after: "${after}"` : '';

    // Combine all filters
    const filters = [
        `first: ${first}`,
        tagsFilter ? `tags: [${tagsFilter}]` : '',
        ownersFilter,
        afterFilter
    ].filter(Boolean).join(', ');

    // Build the complete query
    return {
        query: `
                query {
                transactions(${filters}) {
                    pageInfo {
                    hasNextPage
                    }
                    edges {
                    cursor
                    node {
                        id
                        owner {
                        address
                        }
                        data {
                        size
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
                }
                }
            `
    };
}

/**
 * Build a GraphQL query to fetch user's profile from arweave-account
 * @param {string} address - Wallet address
 * @returns {Object} GraphQL query object
 */
export function buildProfileQuery(address) {
    return {
        query: `
                query {
                transactions(
                    owners: ["${address}"],
                    tags: [
                    { name: "App-Name", values: ["arweave-account"] },
                    { name: "Type", values: ["profile"] }
                    ],
                    first: 1
                ) {
                    edges {
                    node {
                        id
                        data {
                        size
                        }
                    }
                    }
                }
                }
            `
    };
}

/**
 * Build a GraphQL query to search certificates by text
 * @param {string} searchText - Text to search for
 * @param {number} first - Number of results to return
 * @returns {Object} GraphQL query object
 */
export function buildCertificateSearchQuery(searchText, first = 20) {
    return {
        query: `
                query {
                transactions(
                    first: ${first},
                    tags: [
                    { name: "App-Name", values: ["VeriChain"] },
                    { name: "Type", values: ["Certificate"] }
                    ],
                    tags_filter: {
                    op: "OR",
                    filters: [
                        { op: "LIKE", name: "Certificate-Title", values: ["${searchText}%"] },
                        { op: "LIKE", name: "Issuer", values: ["${searchText}%"] },
                        { op: "LIKE", name: "Recipient", values: ["${searchText}%"] }
                    ]
                    }
                ) {
                    edges {
                    node {
                        id
                        owner {
                        address
                        }
                        tags {
                        name
                        value
                        }
                    }
                    }
                }
                }
            `
    };
}

/**
 * Execute a GraphQL query against the Arweave gateway
 * @param {Object} query - GraphQL query object
 * @param {string} endpoint - GraphQL endpoint URL (default: arweave.net/graphql)
 * @returns {Promise<Object>} Query results
 */
export async function executeQuery(query, endpoint = null) {
    const url = endpoint || `https://${process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'arweave.net'}/graphql`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(query),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error executing GraphQL query:', error);
        throw error;
    }
}