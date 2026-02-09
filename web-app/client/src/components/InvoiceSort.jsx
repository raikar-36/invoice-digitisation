import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * InvoiceSort Component
 * 
 * Client-side sorting for invoice lists. Works on already-fetched data.
 * 
 * @param {function} onSortChange - Callback function when sort option changes
 * @param {boolean} includeStatus - Whether to include status sorting (only for All Invoices page)
 * @param {string} storageKey - Unique key for sessionStorage persistence
 */
const InvoiceSort = ({ onSortChange, includeStatus = false, storageKey }) => {
  const savedSort = sessionStorage.getItem(storageKey) || 'created_desc';

  const handleSortChange = (value) => {
    sessionStorage.setItem(storageKey, value);
    onSortChange(value);
  };

  const getDisplayLabel = () => {
    const sortLabels = {
      'created_desc': 'Recently Created',
      'created_asc': 'Oldest Created',
      'invoice_date_desc': 'Newest Invoice Date',
      'invoice_date_asc': 'Oldest Invoice Date',
      'amount_desc': 'Highest Amount',
      'amount_asc': 'Lowest Amount',
      'customer_asc': 'Customer A-Z',
      'customer_desc': 'Customer Z-A',
      'invoice_number_asc': 'Invoice # Asc',
      'invoice_number_desc': 'Invoice # Desc',
      'status': 'By Status'
    };
    return sortLabels[savedSort] || 'Recently Created';
  };

  return (
    <Select value={savedSort} onValueChange={handleSortChange}>
      <SelectTrigger className="h-9 w-auto min-w-[160px]">
        <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue>
          {getDisplayLabel()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Date Sorting */}
        <SelectGroup>
          <SelectLabel>By Created Date</SelectLabel>
          <SelectItem value="created_desc">Recently Created</SelectItem>
          <SelectItem value="created_asc">Oldest Created</SelectItem>
        </SelectGroup>
        
        <SelectSeparator />
        
        <SelectGroup>
          <SelectLabel>By Invoice Date</SelectLabel>
          <SelectItem value="invoice_date_desc">Newest First</SelectItem>
          <SelectItem value="invoice_date_asc">Oldest First</SelectItem>
        </SelectGroup>
        
        <SelectSeparator />
        
        {/* Amount Sorting */}
        <SelectGroup>
          <SelectLabel>By Amount</SelectLabel>
          <SelectItem value="amount_desc">Highest Amount</SelectItem>
          <SelectItem value="amount_asc">Lowest Amount</SelectItem>
        </SelectGroup>
        
        <SelectSeparator />
        
        {/* Customer Sorting */}
        <SelectGroup>
          <SelectLabel>By Customer</SelectLabel>
          <SelectItem value="customer_asc">A-Z</SelectItem>
          <SelectItem value="customer_desc">Z-A</SelectItem>
        </SelectGroup>
        
        <SelectSeparator />
        
        {/* Invoice Number Sorting */}
        <SelectGroup>
          <SelectLabel>By Invoice Number</SelectLabel>
          <SelectItem value="invoice_number_asc">Ascending</SelectItem>
          <SelectItem value="invoice_number_desc">Descending</SelectItem>
        </SelectGroup>
        
        {/* Status Sorting (All Invoices Only) */}
        {includeStatus && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>By Status</SelectLabel>
              <SelectItem value="status">Group by Status</SelectItem>
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default InvoiceSort;
