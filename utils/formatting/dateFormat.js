/**
 * Format a date string or timestamp for display
 * 
 * @param {string|number} dateInput - Date string or timestamp
 * @param {string} format - Format style: 'full', 'short', 'relative'
 * @returns {string} Formatted date
 */
export const formatDate = (dateInput, format = 'full') => {
    if (!dateInput) {
        return 'N/A';
    }

    let date;
    try {
        // Handle timestamp in seconds (blockchain timestamps)
        if (typeof dateInput === 'number' && dateInput < 100000000000) {
            date = new Date(dateInput * 1000);
        } else {
            date = new Date(dateInput);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
    } catch (error) {
        console.error('Error parsing date:', error);
        return 'Invalid date';
    }

    // Format based on requested style
    switch (format) {
        case 'full':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'short':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        case 'relative':
            return getRelativeTimeString(date);
        default:
            return date.toLocaleDateString();
    }
};

/**
 * Get a relative time string (e.g., "2 days ago")
 * 
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
        return 'just now';
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than a day
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Less than a week
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    // Use standard date format for older dates
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

