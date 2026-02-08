import { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { productAPI } from '../services/api';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const ProductAutoComplete = ({ 
  value, 
  onChange, 
  onProductSelect,
  onCreateNew,
  placeholder = "Type product name...",
  className = ""
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  // Debounced product search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if value is 2+ characters
    if (value && value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          setLoading(true);
          const response = await productAPI.search(value.trim());
          setProducts(response.data.products || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Product search error:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setProducts([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product) => {
    onChange(product.name);
    setShowSuggestions(false);
    
    if (onProductSelect) {
      onProductSelect({
        id: product.id,
        name: product.name,
        standard_price: product.standard_price
      });
    }
  };

  const handleCreateNew = () => {
    setShowSuggestions(false);
    if (onCreateNew) {
      onCreateNew(value);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || products.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < products.length ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < products.length) {
        handleSelect(products[highlightedIndex]);
      } else if (highlightedIndex === products.length) {
        handleCreateNew();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          onFocus={() => {
            if (value && value.trim().length >= 2 && products.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {showSuggestions && (value && value.trim().length >= 2) && (
        <Card className="absolute z-50 w-full mt-1 p-1 max-h-[300px] overflow-auto shadow-lg">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Searching...
            </div>
          )}
          
          {!loading && products.length === 0 && (
            <div className="p-3 text-center">
              <p className="text-sm text-muted-foreground mb-2">No products found</p>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 text-sm text-primary hover:underline mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create &apos;{value}&apos; as new product
              </button>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div>
              {products.map((product, index) => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={`flex items-center justify-between p-2 cursor-pointer rounded hover:bg-accent ${
                    highlightedIndex === index ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-sm">{product.name}</span>
                  {product.standard_price && (
                    <span className="text-xs font-mono text-muted-foreground">
                      ₹{parseFloat(product.standard_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              ))}
              <div
                onClick={handleCreateNew}
                className={`flex items-center gap-2 p-2 cursor-pointer rounded hover:bg-accent text-primary border-t mt-1 ${
                  highlightedIndex === products.length ? 'bg-accent' : ''
                }`}
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Create &apos;{value}&apos; as new product</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ProductAutoComplete;
