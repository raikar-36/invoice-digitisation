import React from 'react';
import { formatDate } from '../utils/dateFormatter';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="bg-emerald-500/5 border-border/50 mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">Existing Customer Found</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This customer already exists in your database
            </p>
          </div>
        </div>

        {/* Customer Details */}
        <Card className="mb-4">
          <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase">Name</span>
              <p className="font-semibold tracking-tight">{customer.name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Phone</span>
              <p className="font-semibold tracking-tight">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">Email</span>
              <p className="font-semibold tracking-tight">{customer.email || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase">GSTIN</span>
              <p className="font-semibold tracking-tight">{customer.gstin || 'Not provided'}</p>
            </div>
            {customer.address && (
              <div className="md:col-span-2">
                <span className="text-xs text-muted-foreground uppercase">Address</span>
                <p className="font-semibold tracking-tight">{customer.address}</p>
              </div>
            )}
          </div>

          {/* Purchase Statistics */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {customer.invoice_count || 0}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Invoices</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(customer.lifetime_value)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Total Value</div>
              </div>
              <div>
                <div className="text-sm font-bold text-purple-600">
                  {formatDate(customer.last_purchase)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">Last Purchase</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Selection Options */}
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 bg-background rounded-lg border-2 cursor-pointer hover:border-emerald-500 transition-colors">
            <input
              type="radio"
              name="customerSelection"
              value="existing"
              checked={selectedOption === 'existing'}
              onChange={() => onOptionChange('existing')}
              className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <div className="font-semibold tracking-tight">Use this existing customer</div>
              <div className="text-sm text-muted-foreground">
                Link this invoice to the customer record shown above
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 bg-background rounded-lg border-2 cursor-pointer hover:border-amber-500 transition-colors">
            <input
              type="radio"
              name="customerSelection"
              value="different"
              checked={selectedOption === 'different'}
              onChange={() => onOptionChange('different')}
              className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500"
            />
            <div className="flex-1">
              <div className="font-semibold tracking-tight">This is a different customer</div>
              <div className="text-sm text-muted-foreground">
                Create a new customer record despite matching phone number
              </div>
            </div>
          </label>
        </div>

        {selectedOption === 'different' && (
          <Card className="mt-3 bg-amber-500/5 border-border/50">
            <CardContent className="py-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold tracking-tight text-amber-800 dark:text-amber-300">Warning: Potential Duplicate</div>
                  <div className="text-sm text-muted-foreground">
                    Phone number already exists. Please confirm this is a different customer before proceeding.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerMatchCard;
