import React from 'react';

const CustomerSuggestions = ({ suggestions, onSelect }) => {
  const formatSimilarity = (score) => {
    return `${(parseFloat(score) * 100).toFixed(0)}% match`;
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-5 mb-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-yellow-800">Similar Customers Found</h3>
        </div>
        <p className="text-sm text-yellow-600">
          We found {suggestions.length} customer{suggestions.length > 1 ? 's' : ''} with similar names. 
          Click to select if this is the same customer.
        </p>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            onClick={() => onSelect(suggestion)}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-yellow-500 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{suggestion.name}</h4>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    {formatSimilarity(suggestion.similarity_score)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Phone:</span> {suggestion.phone || 'Not provided'}
                  </div>
                  {suggestion.email && (
                    <div>
                      <span className="font-medium">Email:</span> {suggestion.email}
                    </div>
                  )}
                  {suggestion.gstin && (
                    <div>
                      <span className="font-medium">GSTIN:</span> {suggestion.gstin}
                    </div>
                  )}
                  {suggestion.address && (
                    <div>
                      <span className="font-medium">Address:</span> {suggestion.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Stats */}
            {(suggestion.invoice_count > 0 || suggestion.lifetime_value > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Invoices: </span>
                    <span className="font-semibold text-gray-900">{suggestion.invoice_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Value: </span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 0
                      }).format(suggestion.lifetime_value || 0)}
                    </span>
                  </div>
                  {suggestion.last_purchase && (
                    <div>
                      <span className="text-gray-500">Last Purchase: </span>
                      <span className="font-semibold text-gray-900">
                        {new Date(suggestion.last_purchase).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 text-center">
              <button
                type="button"
                className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 underline"
              >
                Click to use this customer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-300">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">Not the right customer?</span> Continue filling the form below to create a new customer record.
        </div>
      </div>
    </div>
  );
};

export default CustomerSuggestions;
