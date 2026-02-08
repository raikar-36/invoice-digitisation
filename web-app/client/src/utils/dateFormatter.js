/**
 * Format a date to dd/mm/yyyy format
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date to dd/mm/yyyy with time
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string in dd/mm/yyyy HH:mm format
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
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
