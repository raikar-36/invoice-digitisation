import React from 'react';
import { formatDate } from '../utils/dateFormatter';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const CustomerSuggestions = ({ suggestions, onSelect }) => {
  const formatSimilarity = (score) => {
    return `${(parseFloat(score) * 100).toFixed(0)}% match`;
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-amber-500/5 border-border/50 mb-4">
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold tracking-tight text-amber-800 dark:text-amber-300">Similar Customers Found</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            We found {suggestions.length} customer{suggestions.length > 1 ? 's' : ''} with similar names. 
            Click to select if this is the same customer.
          </p>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Card
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className="cursor-pointer transition-all hover:shadow-md hover:border-amber-500"
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold tracking-tight">{suggestion.name}</h4>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded">
                        {formatSimilarity(suggestion.similarity_score)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
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
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Invoices: </span>
                        <span className="font-semibold">{suggestion.invoice_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Value: </span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0
                          }).format(suggestion.lifetime_value || 0)}
                        </span>
                      </div>
                      {suggestion.last_purchase && (
                        <div>
                          <span className="text-muted-foreground">Last Purchase: </span>
                          <span className="font-semibold">
                            {formatDate(suggestion.last_purchase)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline"
                  >
                    Click to use this customer
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4 bg-muted/50">
          <CardContent className="py-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Not the right customer?</span> Continue filling the form below to create a new customer record.
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default CustomerSuggestions;
