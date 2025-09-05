/**
 * Format success response
 * @param {*} data - The data to be returned
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted response object
 */
const formatSuccess = (data, statusCode = 200) => {
    return {
        status: 'success',
        statusCode,
        data
    };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error object
 */
const formatError = (message, statusCode = 400) => {
    return {
        status: 'error',
        statusCode,
        message
    };
};

export { formatSuccess, formatError };