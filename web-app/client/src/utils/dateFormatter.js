/**
 * Convert UTC date to IST (Asia/Kolkata timezone)
 * IST is UTC+5:30
 * @param {Date|string} date - The date to convert
 * @returns {Date} - Date object in IST
 */
const toIST = (date) => {
  const utcDate = new Date(date);
  // IST offset is +5 hours 30 minutes (330 minutes)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(utcDate.getTime() + istOffset);
};

/**
 * Format a date to dd/mm/yyyy format in IST
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy format (IST)
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  // Convert to IST
  const istDate = toIST(dateObj);
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date to dd/mm/yyyy with time in IST
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy HH:mm:ss format (IST)
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  // Convert to IST
  const istDate = toIST(dateObj);
  
  const day = String(istDate.getDate()).padStart(2, '0');
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const year = istDate.getFullYear();
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} IST`;
};

/**
 * Convert yyyy-mm-dd to dd/mm/yyyy for display
 * @param {string} isoDate - Date in yyyy-mm-dd format
 * @returns {string} - Formatted date string in dd/mm/yyyy format
 */
export const formatISODate = (isoDate) => {
  if (!isoDate) return '';
  
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Convert dd/mm/yyyy to yyyy-mm-dd for API/database
 * @param {string} displayDate - Date in dd/mm/yyyy format
 * @returns {string} - Date in yyyy-mm-dd format
 */
export const toISODate = (displayDate) => {
  if (!displayDate) return '';
  
  const [day, month, year] = displayDate.split('/');
  return `${year}-${month}-${day}`;
};
