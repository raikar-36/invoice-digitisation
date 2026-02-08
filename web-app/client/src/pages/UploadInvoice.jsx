import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, Loader2, CheckCircle2, FileText, Image as ImageIcon, ScanLine, X } from 'lucide-react';

const UploadInvoice = () => {
  const [files, setFiles] = useState([]);
  const [uploadStage, setUploadStage] = useState('idle'); // 'idle', 'uploading', 'uploaded', 'processing'
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const validFiles = newFiles.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== newFiles.length) {
      setError('Some files were rejected. Only JPEG, PNG, and PDF files are allowed.');
    } else {
      setError('');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 10485760) {
      setError('Total file size exceeds 10MB limit');
      return;
    }

    setUploadStage('uploading');
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await invoiceAPI.upload(formData);
      
      if (response.data.success) {
        // Stage 1: Upload complete
        setUploadStage('uploaded');
        
        // Stage 2: Start OCR processing after brief delay
        setTimeout(() => {
          setUploadStage('processing');
          
          // Simulate processing time, then navigate
          setTimeout(() => {
            navigate(`/dashboard/review/${response.data.invoiceId}`);
          }, 2500);
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setUploadStage('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8">Upload Invoice</h1>

      {/* Stage 2: OCR Processing View */}
      <AnimatePresence>
        {uploadStage === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  {/* Scanning Animation */}
                  <div className="relative bg-muted/50 rounded-lg p-8 overflow-hidden">
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                      animate={{
                        y: [0, 400, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    
                    {/* Skeleton Preview */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                      
                      <Skeleton className="h-px w-full" />
                      
                      {/* Items Table Skeleton */}
                      <div className="space-y-3">
                        <Skeleton className="h-6 w-[300px]" />
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-4">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-20" />
                            <Skeleton className="h-10 w-24" />
                          </div>
                        ))}
                      </div>
                      
                      <Skeleton className="h-px w-full" />
                      
                      {/* Footer Skeleton */}
                      <div className="flex justify-end">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-6 w-[200px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pulsing Status */}
                  <div className="mt-6 flex items-center justify-center gap-3" role="status" aria-live="polite">
                    <ScanLine className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <p className="text-muted-foreground">
                      AI is extracting data... please wait.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 1: Upload Interface */}
      {uploadStage !== 'processing' && (
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-border bg-muted/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold tracking-tight mb-2">
                Drop invoice files here
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse (JPEG, PNG, PDF • Max 10MB total)
              </p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button asChild disabled={uploadStage !== 'idle'}>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Files
                  </motion.span>
                </Button>
              </label>
            </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="text-lg font-semibold tracking-tight mb-4">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {file.type.startsWith('image') ? (
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-destructive hover:text-destructive"
                            disabled={uploadStage !== 'idle'}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={uploadStage !== 'idle'}
                >
                  Clear All
                </Button>
                
                {/* Multi-Stage Upload Button */}
                <AnimatePresence mode="wait">
                  {uploadStage === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button onClick={handleUpload}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Invoice
                      </Button>
                    </motion.div>
                  )}
                  
                  {uploadStage === 'uploading' && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button disabled>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </Button>
                    </motion.div>
                  )}
                  
                  {uploadStage === 'uploaded' && (
                    <motion.div
                      key="uploaded"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button 
                        disabled 
                        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Uploaded
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default UploadInvoice;
