import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({ value, onChange, onBlur, placeholder = "Pick a date", disabled }) {
  const [date, setDate] = React.useState(value ? new Date(value) : undefined);
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      setDate(dateObj);
      // Display in DD/MM/YYYY format
      setInputValue(format(dateObj, 'dd/MM/yyyy'));
    } else {
      setDate(undefined);
      setInputValue('');
    }
  }, [value]);

  const handleSelect = (selectedDate) => {
    setDate(selectedDate);
    if (onChange) {
      // Format as yyyy-mm-dd for consistency with backend
      const formatted = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
      // Display in DD/MM/YYYY format
      setInputValue(selectedDate ? format(selectedDate, 'dd/MM/yyyy') : '');
      onChange(formatted);
    }
  };

  const handleManualInput = (e) => {
    let input = e.target.value;
    
    // Only allow numbers and slashes
    input = input.replace(/[^0-9/]/g, '');
    
    // Limit to 10 characters (DD/MM/YYYY)
    if (input.length > 10) {
      return;
    }

    // Auto-add slashes after day and month
    if (input.length === 2 && inputValue.length === 1) {
      input += '/';
    } else if (input.length === 5 && inputValue.length === 4) {
      input += '/';
    }

    // Validate ranges as they type
    const parts = input.split('/');
    if (parts.length >= 1 && parts[0].length === 2) {
      const day = parseInt(parts[0]);
      if (day < 1 || day > 31) {
        return; // Don't allow invalid day (must be 01-31)
      }
    }
    if (parts.length >= 2 && parts[1].length === 2) {
      const month = parseInt(parts[1]);
      if (month < 1 || month > 12) {
        return; // Don't allow invalid month (must be 01-12)
      }
    }
    if (parts.length >= 3 && parts[2].length === 4) {
      const year = parseInt(parts[2]);
      if (year < 1900 || year > 2100) {
        return; // Don't allow unrealistic years
      }
    }
    
    setInputValue(input);

    // Only try to parse if input looks complete
    if (input.length === 10) {
      tryParseDate(input);
    }
  };

  const tryParseDate = (input) => {
    // Try to parse common date formats (prioritize DD/MM/YYYY)
    const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
    
    for (const formatString of formats) {
      try {
        const parsedDate = parse(input, formatString, new Date());
        if (isValid(parsedDate)) {
          setDate(parsedDate);
          if (onChange) {
            onChange(format(parsedDate, 'yyyy-MM-dd'));
          }
          return true;
        }
      } catch (err) {
        // Continue to next format
      }
    }

    // If no format matched and input is empty, clear the date
    if (!input) {
      setDate(undefined);
      if (onChange) {
        onChange('');
      }
      return true;
    }
    
    return false;
  };

  const handleBlur = (e) => {
    const input = e.target.value;
    if (input && input.length > 0) {
      // Try to parse on blur even if input is short
      tryParseDate(input);
    }
    // Call parent's onBlur if provided
    if (onBlur) {
      onBlur(date ? format(date, 'yyyy-MM-dd') : '');
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={inputValue}
        onChange={handleManualInput}
        onBlur={handleBlur}
        placeholder="DD/MM/YYYY"
        disabled={disabled}
        maxLength={10}
        className="flex-1"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            disabled={disabled}
            className={cn(
              "px-3",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
