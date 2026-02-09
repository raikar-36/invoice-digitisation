import React from 'react';
import { formatDate } from '../utils/dateFormatter';
import { CheckCircle2, FileText, IndianRupee, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomerMatchCard = ({ customer, selectedOption, onOptionChange }) => {
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
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">
                Existing Customer Found
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This customer already exists in your database
            </p>
          </div>
        </div>

        {/* Customer Details - Flattened Structure */}
        <div className="border rounded-lg p-4 mb-4 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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

          {/* Purchase Statistics with Icons */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {customer.invoice_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">Invoices</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(customer.lifetime_value)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">Lifetime Value</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {formatDate(customer.last_purchase)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">Last Purchase</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Options with Shadcn RadioGroup */}
        <RadioGroup value={selectedOption} onValueChange={onOptionChange} className="space-y-3">
          {/* Existing Customer Option */}
          <label
            htmlFor="existing"
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'existing'
                ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                : 'border-border hover:border-emerald-300'
            }`}
          >
            <RadioGroupItem value="existing" id="existing" className="mt-1" />
            <div className="flex-1">
              <div className="font-semibold tracking-tight">Use this existing customer</div>
              <div className="text-sm text-muted-foreground">
                Link this invoice to the customer record shown above
              </div>
            </div>
          </label>

          {/* Different Customer Option */}
          <label
            htmlFor="different"
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedOption === 'different'
                ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                : 'border-border hover:border-amber-300'
            }`}
          >
            <RadioGroupItem value="different" id="different" className="mt-1" />
            <div className="flex-1">
              <div className="font-semibold tracking-tight">This is a different customer</div>
              <div className="text-sm text-muted-foreground">
                Create a new customer record despite matching phone number
              </div>
            </div>
          </label>
        </RadioGroup>

        {/* Compact Warning for Different Option */}
        {selectedOption === 'different' && (
          <Alert variant="warning" className="mt-3 bg-amber-500/10 border-amber-500/30">
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Warning:</span> Phone number already exists. 
              Please confirm this is a different customer before proceeding.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerMatchCard;
