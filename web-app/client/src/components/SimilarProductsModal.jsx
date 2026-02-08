import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const SimilarProductsModal = ({ 
  open, 
  onOpenChange, 
  newProductName,
  similarProducts,
  onUseExisting,
  onCreateNew
}) => {
  const [selectedProductId, setSelectedProductId] = useState(null);

  const handleUseExisting = () => {
    if (!selectedProductId) return;
    const selectedProduct = similarProducts.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      onUseExisting(selectedProduct);
    }
  };

  const handleCreateNew = () => {
    onCreateNew();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
            Similar Products Found
          </DialogTitle>
          <DialogDescription>
            We found {similarProducts.length} similar {similarProducts.length === 1 ? 'product' : 'products'} in the system. 
            Select one to use or create &apos;{newProductName}&apos; as a new product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <RadioGroup value={selectedProductId} onValueChange={setSelectedProductId}>
            {similarProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent cursor-pointer">
                <RadioGroupItem value={product.id} id={`product-${product.id}`} />
                <Label 
                  htmlFor={`product-${product.id}`} 
                  className="flex flex-col flex-1 cursor-pointer"
                >
                  <span className="font-semibold">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Standard: ₹{parseFloat(product.standard_price || 0).toLocaleString('en-IN')}
                    {product.sim && (
                      <span className="ml-2">• Match: {(parseFloat(product.sim) * 100).toFixed(0)}%</span>
                    )}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleCreateNew}
            variant="ghost"
            className="text-sm w-full sm:w-auto"
          >
            Create &apos;{newProductName}&apos; Anyway
          </Button>
          <Button
            onClick={handleUseExisting}
            disabled={!selectedProductId}
            className="w-full sm:w-auto"
          >
            Use Selected Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimilarProductsModal;
