import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { invoiceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { showToast, confirmAction } from '../utils/toast.jsx';
import { formatDate } from '../utils/dateFormatter';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Download, FileText } from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const [invoiceRes, docsRes] = await Promise.all([
        invoiceAPI.getById(id),
        invoiceAPI.getDocuments(id).catch(() => ({ data: { documents: [] } }))
      ]);
      
      // Handle both response formats
      const invoiceData = invoiceRes.data.invoice || invoiceRes.data;
      setInvoice(invoiceData);
      
      const docs = docsRes.data?.documents || (Array.isArray(docsRes.data) ? docsRes.data : []);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    confirmAction('Generate PDF for this invoice?', async () => {
      try {
        setGeneratingPdf(true);
        const response = await invoiceAPI.generatePdf(id);
        showToast.success('PDF generated successfully!');
        // Reload invoice to get updated PDF info
        await loadInvoice();
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        showToast.error(error.response?.data?.message || 'Failed to generate PDF');
      } finally {
        setGeneratingPdf(false);
      }
    });
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfDocId = invoice.generated_pdf_document_id;
      if (!pdfDocId) return;
      
      const response = await invoiceAPI.downloadDocument(id, pdfDocId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <Card className="text-center py-12">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold">Invoice not found</h2>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Invoice {invoice.invoice_number}
          </h1>
          <div className="flex gap-3">
            {invoice.generated_pdf_document_id && (
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
            {user?.role === 'OWNER' && invoice.status === 'APPROVED' && !invoice.generated_pdf_document_id && (
              <Button
                onClick={handleGeneratePdf}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Documents */}
          {documents.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg overflow-hidden mb-4" style={{ minHeight: '400px' }}>
                    {documents[currentDocIndex]?.content_type === 'application/pdf' ? (
                      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                        <svg className="w-32 h-32 text-red-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6"/>
                          <text x="7" y="18" fontSize="6" fill="white" fontWeight="bold">PDF</text>
                        </svg>
                        <p className="font-medium mb-4">
                          {documents[currentDocIndex]?.file_name || 'Generated PDF'}
                        </p>
                        <Button
                          onClick={() => window.open(`/api/documents/${documents[currentDocIndex]?.document_id}`, '_blank')}
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open PDF in New Tab
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={`/api/documents/${documents[currentDocIndex]?.document_id}`}
                        alt={`Document ${currentDocIndex + 1}`}
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                  {documents.length > 1 && (
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
                        disabled={currentDocIndex === 0}
                      >
                        ← Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentDocIndex + 1} of {documents.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDocIndex(Math.min(documents.length - 1, currentDocIndex + 1))}
                        disabled={currentDocIndex === documents.length - 1}
                      >
                        Next →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Right Column - Details */}
          <div className={documents.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-lg font-mono tabular-nums">₹{parseFloat(invoice.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">{invoice.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(invoice.customer_name || invoice.customer_email || invoice.customer_address || invoice.customer_gstin) && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {invoice.customer_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-semibold">{invoice.customer_name}</p>
                      </div>
                    )}
                    {invoice.customer_phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold">{invoice.customer_phone}</p>
                      </div>
                    )}
                    {invoice.customer_email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{invoice.customer_email}</p>
                      </div>
                    )}
                    {invoice.customer_gstin && (
                      <div>
                        <p className="text-sm text-muted-foreground">GSTIN</p>
                        <p className="font-semibold">{invoice.customer_gstin}</p>
                      </div>
                    )}
                    {invoice.customer_address && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-semibold">{invoice.customer_address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {invoice.items && invoice.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name || item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">₹{parseFloat(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold font-mono tabular-nums">
                            ₹{parseFloat(item.line_total).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceDetail;
