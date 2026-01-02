/**
 * Phone Normalization Utility
 * Handles various phone number formats and normalizes them for consistent matching
 */

/**
 * Normalize phone number to 10-digit Indian format
 * @param {string} phone - Phone number in any format
 * @returns {string|null} - Normalized 10-digit phone number or null if invalid
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters (spaces, dashes, parentheses, plus signs)
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code prefixes
  // +91 (India), 0091, or 91 prefix
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0091') && cleaned.length === 14) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Remove leading 0 from Indian numbers
    cleaned = cleaned.substring(1);
  }
  
  // Validate 10-digit format
  if (cleaned.length !== 10 || !/^[6-9]\d{9}$/.test(cleaned)) {
    return null; // Invalid Indian mobile number
  }
  
  return cleaned;
};

/**
 * Format phone number for display (10 digits to readable format)
 * @param {string} phone - 10-digit phone number
 * @returns {string} - Formatted phone number (e.g., "98765 43210")
 */
const formatPhoneDisplay = (phone) => {
  if (!phone || phone.length !== 10) return phone;
  return `${phone.substring(0, 5)} ${phone.substring(5)}`;
};

/**
 * Validate if two phone numbers are the same after normalization
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} - True if both normalize to the same number
 */
const phonesMatch = (phone1, phone2) => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  return normalized1 && normalized2 && normalized1 === normalized2;
};

module.exports = {
  normalizePhone,
  formatPhoneDisplay,
  phonesMatch
};
