import React from 'react';
import { formatDate } from '../utils/dateFormatter';

const CustomerMatchCard = ({ customer, onSelect, selectedOption, onOptionChange }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-5 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">✓</span>
            <h3 className="text-lg font-bold text-green-800">Existing Customer Found</h3>
          </div>
          <p className="text-sm text-green-600">
            This customer already exists in your database
          </p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Name</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.name || 'N/A'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Phone</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.phone || 'N/A'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Email</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.email || 'Not provided'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">GSTIN</span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.gstin || 'Not provided'}</p>
          </div>
          {customer.address && (
            <div className="md:col-span-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Address</span>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{customer.address}</p>
            </div>
          )}
        </div>

        {/* Purchase Statistics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {customer.invoice_count || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase">Invoices</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(customer.lifetime_value)}
              </div>
              <div className="text-xs text-gray-500 uppercase">Total Value</div>
            </div>
            <div>
              <div className="text-sm font-bold text-purple-600">
                {formatDate(customer.last_purchase)}
              </div>
              <div className="text-xs text-gray-500 uppercase">Last Purchase</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Options */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-500 transition-colors">
          <input
            type="radio"
            name="customerSelection"
            value="existing"
            checked={selectedOption === 'existing'}
            onChange={() => onOptionChange('existing')}
            className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Use this existing customer</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Link this invoice to the customer record shown above
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:border-yellow-500 transition-colors">
          <input
            type="radio"
            name="customerSelection"
            value="different"
            checked={selectedOption === 'different'}
            onChange={() => onOptionChange('different')}
            className="mt-1 w-4 h-4 text-yellow-600 focus:ring-yellow-500"
          />
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100">This is a different customer</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Create a new customer record despite matching phone number
            </div>
          </div>
        </label>
      </div>

      {selectedOption === 'different' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-800">Warning: Potential Duplicate</div>
              <div className="text-sm text-yellow-700">
                Phone number already exists. Please confirm this is a different customer before proceeding.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMatchCard;
