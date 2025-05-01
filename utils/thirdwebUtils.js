// utils/thirdwebUtils.js
/**
 * Patch for ThirdWeb circular reference JSON serialization issue
 * 
 * This function should be called once when your application initializes
 * to replace the default JSON.stringify with a version that handles circular references
 */
export function patchCircularJsonIssue() {
    // Only apply in browser environment
    if (typeof window === 'undefined') return;

    // Store the original stringify method
    const originalStringify = JSON.stringify;

    // Create a new stringify method that handles circular references
    JSON.stringify = function (obj, replacer, spaces) {
        const seen = new WeakSet();

        // Custom replacer that handles circular references
        const customReplacer = (key, value) => {
            // Apply the original replacer if provided
            if (replacer) {
                value = replacer(key, value);
            }

            // Handle non-objects or null
            if (typeof value !== 'object' || value === null) {
                return value;
            }

            // Handle DOM nodes and React fiber nodes (common sources of circular references)
            if (value instanceof Node || key === '_owner' || key === '__reactFiber$' || key.startsWith('__reactFiber$')) {
                return '[Circular Reference]';
            }

            // Handle other circular references
            if (seen.has(value)) {
                return '[Circular Reference]';
            }

            seen.add(value);
            return value;
        };

        try {
            // Try to stringify with custom replacer
            return originalStringify(obj, customReplacer, spaces);
        } catch (err) {
            // Fallback - if we still get errors, try a more aggressive approach
            console.warn('First attempt at handling circular reference failed:', err);

            // More aggressive replacer that converts any DOM or complex object to a string representation
            const safeReplacer = (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    // Skip certain problematic properties entirely
                    if (key === '_owner' || key === 'stateNode' || key === '__reactFiber$' ||
                        key.startsWith('__reactFiber$') || key.startsWith('__reactProps$')) {
                        return '[Removed for Serialization]';
                    }

                    // For DOM nodes, convert to a string representation of their type
                    if (value instanceof Node) {
                        return `[${value.nodeName || 'DOM Node'}]`;
                    }

                    // For React elements or other complex objects with circular references
                    if (value.$$typeof || seen.has(value)) {
                        return `[${value.type || value.constructor?.name || 'Object'}]`;
                    }

                    seen.add(value);
                }
                return value;
            };

            try {
                return originalStringify(obj, safeReplacer, spaces);
            } catch (finalError) {
                // If all else fails, return a simple error message
                console.error('Failed to stringify object with circular references:', finalError);
                return originalStringify({ error: 'Object could not be stringified due to circular references' });
            }
        }
    };

    console.log('Patched JSON.stringify to handle circular references');
}