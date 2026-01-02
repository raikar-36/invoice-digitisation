/**
 * Date Normalization Utility
 * Handles various date formats and converts them to PostgreSQL-compatible format (YYYY-MM-DD)
 */

/**
 * Normalize date to YYYY-MM-DD format for PostgreSQL
 * @param {string|Date} dateInput - Date in any format
 * @returns {string|null} - Normalized date (YYYY-MM-DD) or null if invalid
 */
const normalizeDate = (dateInput) => {
  if (!dateInput) return null;

  try {
    let date;

    // If already a Date object
    if (dateInput instanceof Date) {
      date = dateInput;
    }
    // If string, try to parse various formats
    else if (typeof dateInput === 'string') {
      const cleaned = dateInput.trim();

      // Replace common separators with standard format
      // Handle formats like: Mar. 14/2018, 14-Mar-2018, 14/03/2018, etc.
      let normalized = cleaned
        .replace(/\./g, '')  // Remove periods (Mar. -> Mar)
        .replace(/\//g, '-')  // Replace / with -
        .replace(/\s+/g, '-'); // Replace spaces with -

      // Try parsing with Date constructor
      date = new Date(normalized);

      // If invalid, try alternate parsing
      if (isNaN(date.getTime())) {
        // Try DD-MM-YYYY or MM-DD-YYYY formats
        const parts = cleaned.split(/[-/.\s]+/);
        
        if (parts.length === 3) {
          // Try various combinations
          const combinations = [
            // YYYY-MM-DD
            new Date(`${parts[0]}-${parts[1]}-${parts[2]}`),
            // DD-MM-YYYY
            new Date(`${parts[2]}-${parts[1]}-${parts[0]}`),
            // MM-DD-YYYY
            new Date(`${parts[2]}-${parts[0]}-${parts[1]}`),
          ];

          for (const attempt of combinations) {
            if (!isNaN(attempt.getTime())) {
              date = attempt;
              break;
            }
          }
        }
      }
    } else {
      return null;
    }

    // Validate date is valid
    if (!date || isNaN(date.getTime())) {
      return null;
    }

    // Validate date is reasonable (between 1900 and 2100)
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) {
      return null;
    }

    // Format as YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  } catch (error) {
    console.error('Date normalization error:', error.message);
    return null;
  }
};

/**
 * Format date for display
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {string} - Formatted date (e.g., "Mar 14, 2018")
 */
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Check if date string is valid
 * @param {string} dateString - Date string
 * @returns {boolean} - True if valid date
 */
const isValidDate = (dateString) => {
  const normalized = normalizeDate(dateString);
  return normalized !== null;
};

module.exports = {
  normalizeDate,
  formatDateDisplay,
  isValidDate
};
