import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { productAPI } from '../services/api';

const PriceRangeHint = ({ productId, currentPrice }) => {
  const [priceRange, setPriceRange] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setPriceRange(null);
      return;
    }

    const fetchPriceRange = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getPriceRange(productId);
        if (response.data.hasData) {
          setPriceRange(response.data.priceRange);
        } else {
          setPriceRange(null);
        }
      } catch (error) {
        console.error('Price range fetch error:', error);
        setPriceRange(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceRange();
  }, [productId]);

  if (loading || !priceRange) {
    return null;
  }

  const price = parseFloat(currentPrice);
  const isOutOfRange = price && (price < priceRange.min || price > priceRange.max);

  return (
    <div 
      className={`text-[10px] font-medium uppercase tracking-wide mt-1 ${
        isOutOfRange ? 'text-amber-600' : 'text-muted-foreground'
      }`}
    >
      <TrendingUp className="w-3 h-3 inline mr-1" />
      Typical Range: ₹{(priceRange.min || 0).toLocaleString('en-IN')} - ₹{(priceRange.max || 0).toLocaleString('en-IN')}
    </div>
  );
};

export default PriceRangeHint;
