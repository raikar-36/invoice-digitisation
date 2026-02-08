import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';

const UploadInvoice = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
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

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await invoiceAPI.upload(formData);
      
      if (response.data.success) {
        navigate(`/dashboard/invoices/${response.data.invoiceId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8">Upload Invoice</h1>

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
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">
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
              <Button asChild>
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
              <h3 className="text-lg font-semibold mb-4">
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
                            <span className="text-2xl">
                              {file.type.startsWith('image') ? '🖼️' : '📄'}
                            </span>
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
                          >
                            ✕
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
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Process'}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadInvoice;
