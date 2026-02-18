import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useShop } from '../contexts/ShopContext';
import { getDocuments, getDocumentPdfUrl } from '../services/api';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function Documents() {
  const { shop } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Fetch documents
  const { data: documentsData, isLoading, refetch } = useQuery(
    ['documents', typeFilter, statusFilter],
    () => getDocuments({ 
      limit: 50, 
      documentType: typeFilter || undefined,
      status: statusFilter || undefined,
    })
  );

  const documents = documentsData?.documents || [];

  // Filter documents by search
  const filteredDocuments = documents.filter(doc => 
    doc.bsale_document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.shopify_order_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      generated: 'badge-success',
      pending: 'badge-warning',
      sent: 'badge-info',
      error: 'badge-error',
      cancelled: 'badge-gray',
    };
    return statusMap[status] || 'badge-gray';
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      boleta: 'badge-boleta',
      factura: 'badge-factura',
      nota_venta: 'badge-nota-venta',
      nota_credito: 'badge-nota-credito',
    };
    return typeMap[type] || 'badge-gray';
  };

  const handleDownloadPdf = (documentId) => {
    const url = getDocumentPdfUrl(documentId);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage documents generated from your Shopify orders.
          </p>
        </div>
        <button 
          className="btn-secondary"
          onClick={() => refetch()}
        >
          <ArrowPathIcon className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search by document number, order, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="form-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
            <option value="nota_venta">Nota de Venta</option>
            <option value="nota_credito">Nota de Crédito</option>
          </select>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Type</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>
                    <LoadingCard />
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <p className="font-medium text-gray-900">
                        {doc.bsale_document_number || '-'}
                      </p>
                    </td>
                    <td>
                      <span className={getTypeBadge(doc.document_type)}>
                        {doc.document_type}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">{doc.shopify_order_name}</p>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-gray-900">{doc.customer_name || '-'}</p>
                        <p className="text-xs text-gray-500">{doc.customer_rut || ''}</p>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(doc.gross_amount, doc.currency)}
                      </p>
                    </td>
                    <td>
                      <span className={getStatusBadge(doc.status)}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="btn-icon"
                          onClick={() => setSelectedDocument(doc)}
                          title="View details"
                        >
                          <EyeIcon className="w-4 h-4 text-gray-500" />
                        </button>
                        {doc.status === 'generated' && (
                          <button 
                            className="btn-icon"
                            onClick={() => handleDownloadPdf(doc.id)}
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setSelectedDocument(null)} />
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">
                Document Details
              </h3>
            </div>

            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Document Number</p>
                  <p className="font-medium text-gray-900">
                    {selectedDocument.bsale_document_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <span className={getTypeBadge(selectedDocument.document_type)}>
                    {selectedDocument.document_type}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Order</p>
                  <p className="font-medium text-gray-900">
                    {selectedDocument.shopify_order_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={getStatusBadge(selectedDocument.status)}>
                    {selectedDocument.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">
                    {selectedDocument.customer_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">RUT</p>
                  <p className="font-medium text-gray-900">
                    {selectedDocument.customer_rut || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedDocument.net_amount, selectedDocument.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedDocument.tax_amount, selectedDocument.currency)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Gross Amount</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedDocument.gross_amount, selectedDocument.currency)}
                  </p>
                </div>
              </div>

              {selectedDocument.error_message && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Error:</span> {selectedDocument.error_message}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </button>
              {selectedDocument.status === 'generated' && (
                <button 
                  className="btn-primary"
                  onClick={() => handleDownloadPdf(selectedDocument.id)}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}