/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

/**
 * Get OTP expiry time (15 minutes from now)
 * @returns {Date} Expiry date
 */
export const getOTPExpiry = () => {
    return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export const isValidOTPFormat = (otp) => {
    return otp && /^\d{6}$/.test(otp);
};

/**
 * Check if OTP has expired
 * @param {Date} expiryDate - OTP expiry date
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expiryDate) => {
    return expiryDate && new Date() > expiryDate;
};

export default {
    generateOTP,
    getOTPExpiry,
    isValidOTPFormat,
    isOTPExpired
};
