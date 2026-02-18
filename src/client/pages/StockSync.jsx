import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { useShop, usePlanFeatures } from '../contexts/ShopContext';
import { getProductMappings, getStockSyncLogs, syncStock } from '../services/api';
import { 
  ArrowPathIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function StockSync() {
  const { shop } = useShop();
  const features = usePlanFeatures();
  const [syncDirection, setSyncDirection] = useState('bidirectional');

  // Fetch product mappings
  const { data: mappings, isLoading: mappingsLoading, refetch: refetchMappings } = useQuery(
    ['productMappings'],
    () => getProductMappings()
  );

  // Fetch sync logs
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery(
    ['stockSyncLogs'],
    () => getStockSyncLogs({ limit: 20 })
  );

  // Sync mutation
  const syncMutation = useMutation(
    ({ mappingId, direction }) => syncStock(mappingId, direction),
    {
      onSuccess: () => {
        toast.success('Stock synced successfully');
        refetchLogs();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to sync stock');
      },
    }
  );

  const logs = logsData?.logs || [];

  const handleSync = (mappingId, direction) => {
    syncMutation.mutate({ mappingId, direction });
  };

  const handleSyncAll = () => {
    if (!mappings?.length) {
      toast.error('No products mapped');
      return;
    }

    // Sync all products
    mappings.forEach(mapping => {
      if (mapping.sync_stock) {
        syncMutation.mutate({ mappingId: mapping.id, direction: syncDirection });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Synchronization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Synchronize inventory between Shopify and Bsale.
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={handleSyncAll}
          disabled={syncMutation.isLoading || !features.stockSyncEnabled}
        >
          <PlayIcon className="w-4 h-4 mr-1" />
          Sync All
        </button>
      </div>

      {/* Sync Settings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Sync Settings</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Sync Direction</label>
              <select 
                className="form-input"
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value)}
              >
                <option value="bidirectional">Bidirectional</option>
                <option value="shopify_to_bsale">Shopify to Bsale</option>
                <option value="bsale_to_shopify">Bsale to Shopify</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sync Interval</label>
              <p className="text-sm text-gray-900 mt-2">
                Every {features.stockSyncIntervalMinutes} minutes
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="flex items-center mt-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${features.stockSyncEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-900">
                  {features.stockSyncEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapped Products */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Mapped Products</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Shopify Product</th>
                <th>Bsale Product</th>
                <th>Last Sync</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappingsLoading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingCard />
                  </td>
                </tr>
              ) : !mappings?.length ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No products mapped. Go to Products page to map your products.
                  </td>
                </tr>
              ) : (
                mappings.map((mapping) => (
                  <tr key={mapping.id}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{mapping.shopify_product_title}</p>
                        <p className="text-xs text-gray-500">SKU: {mapping.shopify_sku || 'N/A'}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{mapping.bsale_name}</p>
                        <p className="text-xs text-gray-500">ID: {mapping.bsale_product_id}</p>
                      </div>
                    </td>
                    <td>
                      {mapping.last_stock_sync_at ? (
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(mapping.last_stock_sync_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {mapping.last_stock_sync_quantity}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td>
                      {mapping.sync_error ? (
                        <span className="badge-error">{mapping.sync_error}</span>
                      ) : (
                        <span className="badge-success">OK</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => handleSync(mapping.id, syncDirection)}
                        disabled={syncMutation.isLoading || !mapping.sync_stock}
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-1" />
                        Sync
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync History */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Sync History</h2>
            <button 
              className="btn-secondary btn-sm"
              onClick={() => refetchLogs()}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Direction</th>
                <th>Product</th>
                <th>Previous</th>
                <th>New</th>
                <th>Delta</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={7}>
                    <LoadingCard />
                  </td>
                </tr>
              ) : !logs.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No sync history yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="text-sm text-gray-900">
                        {log.direction === 'shopify_to_bsale' ? 'Shopify' : 'Bsale'}
                        {' '}&rarr;{' '}
                        {log.direction === 'shopify_to_bsale' ? 'Bsale' : 'Shopify'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">
                        {log.product_mapping?.bsale_name || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">{log.previous_quantity ?? '-'}</span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900">{log.new_quantity ?? '-'}</span>
                    </td>
                    <td>
                      <span className={`text-sm font-medium ${log.delta > 0 ? 'text-green-600' : log.delta < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {log.delta > 0 ? '+' : ''}{log.delta ?? '-'}
                      </span>
                    </td>
                    <td>
                      {log.status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : log.status === 'error' ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <ClockIcon className="w-5 h-5 text-yellow-500" />
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}