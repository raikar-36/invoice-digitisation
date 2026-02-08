const NodeCache = require('node-cache');

// Initialize cache with TTL of 5 minutes for regular data and 10 minutes for yearly data
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Invalidate all analytics-related caches
 * Call this whenever invoice data changes (approve, reject, submit, update)
 */
function invalidateAnalyticsCache() {
  const keys = cache.keys();
  let deletedCount = 0;
  
  // Delete all cache entries related to analytics/reports
  keys.forEach(key => {
    if (
      key.startsWith('kpi_') ||
      key.startsWith('yearly_count_') ||
      key.startsWith('yearly_revenue_') ||
      key.startsWith('top_count_') ||
      key.startsWith('top_revenue_') ||
      key.startsWith('operational_') ||
      key.startsWith('daily_trend_') ||
      key.startsWith('status_distribution_')
    ) {
      cache.del(key);
      deletedCount++;
    }
  });
  
  console.log(`🔄 Cache invalidated: ${deletedCount} analytics cache entries cleared`);
}

/**
 * Invalidate specific date range caches
 * More targeted invalidation when you know the affected date range
 */
function invalidateDateRangeCache(startDate, endDate) {
  const keys = cache.keys();
  let deletedCount = 0;
  
  keys.forEach(key => {
    if (key.includes(startDate) || key.includes(endDate)) {
      cache.del(key);
      deletedCount++;
    }
  });
  
  console.log(`🔄 Cache invalidated: ${deletedCount} date-range cache entries cleared`);
}

/**
 * Get cache instance for direct use
 */
function getCache() {
  return cache;
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return cache.getStats();
}

/**
 * Clear all cache
 */
function clearAllCache() {
  cache.flushAll();
  console.log('🧹 All cache cleared');
}

module.exports = {
  cache,
  getCache,
  invalidateAnalyticsCache,
  invalidateDateRangeCache,
  getCacheStats,
  clearAllCache
};
