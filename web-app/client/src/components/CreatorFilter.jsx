import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
 * CreatorFilter Component
 * 
 * A reusable filter component that allows OWNER users to filter invoices by creator.
 * Works client-side with already-fetched invoice data.
 * Staff and Accountant roles will not see this component (returns null).
 * 
 * @param {Array} creators - List of creator objects with id, name, count
 * @param {function} onFilterChange - Callback function when filter value changes
 * @param {string} storageKey - Unique key for sessionStorage persistence
 */
const CreatorFilter = ({ creators = [], onFilterChange, storageKey }) => {
  const { user } = useAuth();
  const savedFilter = sessionStorage.getItem(storageKey) || 'all';
  const [selectedValue, setSelectedValue] = useState(savedFilter);

  // Only show for OWNER role
  if (!user || user.role !== 'OWNER') {
    return null;
  }

  useEffect(() => {
    // Apply saved filter on mount
    if (savedFilter === 'all') {
      onFilterChange(null);
    } else if (savedFilter === 'my') {
      onFilterChange('my');
    } else {
      onFilterChange(savedFilter);
    }
  }, []);

  const handleValueChange = (value) => {
    setSelectedValue(value);
    sessionStorage.setItem(storageKey, value);
    onFilterChange(value);
  };

  const getDisplayLabel = () => {
    if (selectedValue === 'all') return 'All Invoices';
    if (selectedValue === 'my') return 'My Invoices';
    
    const creator = creators.find(c => c.id.toString() === selectedValue);
    return creator ? creator.name : 'All Invoices';
  };

  // Empty state - no creators found
  if (creators.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="h-9 w-[140px] border-dashed">
          <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">No creators</span>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="h-9 w-auto min-w-[140px] border-dashed">
        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
        <SelectValue>
          {getDisplayLabel()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[240px] overflow-y-auto">
        {/* System Views */}
        <SelectGroup>
          <SelectLabel>System Views</SelectLabel>
          <SelectItem value="all">All Invoices</SelectItem>
          <SelectItem value="my">My Invoices</SelectItem>
        </SelectGroup>
        
        {/* Staff List */}
        {creators.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Staff Members</SelectLabel>
              {creators.map((creator) => (
                <SelectItem 
                  key={creator.id} 
                  value={creator.id.toString()}
                  className="justify-between"
                >
                  <span className="truncate">{creator.name}</span>
                  <span className="ml-auto pl-4 text-xs text-muted-foreground tabular-nums">
                    ({creator.count})
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default CreatorFilter;
