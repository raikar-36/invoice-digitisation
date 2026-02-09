import { useState } from 'react';
import { AlertTriangle, History } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate } from '../utils/dateFormatter';

const DuplicateInvoiceAlert = ({ 
  open, 
  onOpenChange, 
  duplicates,
  onCancel,
  onProceed
}) => {
  if (!duplicates || duplicates.length === 0) return null;

  const mainDuplicate = duplicates[0];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Potential Duplicate Detected</AlertDialogTitle>
          <AlertDialogDescription>
            This invoice appears similar to an existing record. Please review before proceeding.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {duplicates.slice(0, 3).map((duplicate) => (
            <div 
              key={duplicate.id}
              className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Match found: {duplicate.invoice_number || `INV-${duplicate.id}`}
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    {duplicate.customer_name && `Issued `}
                    {duplicate.days_ago === 0 
                      ? 'today' 
                      : `${duplicate.days_ago} day${duplicate.days_ago !== 1 ? 's' : ''} ago`}
                    {duplicate.customer_name && ` to ${duplicate.customer_name}`}
                    {' for ₹'}
                    {parseFloat(duplicate.total_amount).toLocaleString('en-IN')}
                  </p>
                  {duplicate.invoice_date && (
                    <p className="text-xs text-amber-700/70 dark:text-amber-300/70 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      {formatDate(duplicate.invoice_date)}
                    </p>
                  )}
                  <p className="text-xs text-amber-700/70 dark:text-amber-300/70">
                    Status: <span className="font-medium">{duplicate.status.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}

          {duplicates.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              + {duplicates.length - 3} more similar {duplicates.length - 3 === 1 ? 'invoice' : 'invoices'}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel} 
            autoFocus
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
          >
            Cancel & Review
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onProceed}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Ignore & Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DuplicateInvoiceAlert;
