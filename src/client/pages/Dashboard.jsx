import React from 'react';
import { useQuery } from 'react-query';
import { useShop, usePlanStatus, usePlanFeatures } from '../contexts/ShopContext';
import { getDocuments, getUsage, getStockSyncLogs } from '../services/api';
import { 
  DocumentTextIcon, 
  CubeIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function Dashboard() {
  const { shop } = useShop();
  const { isTrial, trialDaysRemaining, needsPayment } = usePlanStatus();
  const features = usePlanFeatures();

  // Get current month/year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Fetch data
  const { data: documentsData, isLoading: documentsLoading } = useQuery(
    ['documents', { limit: 5 }],
    () => getDocuments({ limit: 5 }),
    { keepPreviousData: true }
  );

  const { data: usage, isLoading: usageLoading } = useQuery(
    ['usage', currentYear, currentMonth],
    () => getUsage(currentYear, currentMonth)
  );

  const { data: syncLogs, isLoading: syncLoading } = useQuery(
    ['stockSyncLogs', { limit: 5 }],
    () => getStockSyncLogs({ limit: 5 })
  );

  const documents = documentsData?.documents || [];
  const syncLogData = syncLogs?.logs || [];

  // Calculate stats
  const stats = [
    {
      name: 'Documents Generated',
      value: usage?.documents_count || 0,
      limit: features.maxDocumentsPerMonth,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Orders Processed',
      value: usage?.orders_count || 0,
      limit: features.maxOrdersPerMonth,
      icon: CubeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Stock Syncs',
      value: usage?.stock_syncs_count || 0,
      icon: ArrowPathIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Errors',
      value: usage?.errors_count || 0,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your Bsale integration.
        </p>
      </div>

      {/* Trial/Payment Alert */}
      {isTrial && trialDaysRemaining > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your trial period ends in <span className="font-medium">{trialDaysRemaining} days</span>. 
                Upgrade to a paid plan to continue using all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {needsPayment && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Your subscription has expired. Please update your payment to continue using the app.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  {stat.limit && (
                    <p className="ml-2 text-sm text-gray-500">/ {stat.limit}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Recent Documents</h2>
          </div>
          <div className="card-body">
            {documentsLoading ? (
              <LoadingCard />
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <DocumentTextIcon className="empty-state-icon" />
                <h3 className="empty-state-title">No documents yet</h3>
                <p className="empty-state-description">
                  Documents will appear here when orders are processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.bsale_document_number || doc.shopify_order_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.document_type} - {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge-${doc.document_type}`}>
                      {doc.document_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Stock Syncs */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Recent Stock Syncs</h2>
          </div>
          <div className="card-body">
            {syncLoading ? (
              <LoadingCard />
            ) : syncLogData.length === 0 ? (
              <div className="empty-state">
                <ArrowPathIcon className="empty-state-icon" />
                <h3 className="empty-state-title">No sync activity</h3>
                <p className="empty-state-description">
                  Stock syncs will appear here when inventory changes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {syncLogData.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {log.status === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.direction === 'shopify_to_bsale' ? 'Shopify' : 'Bsale'} 
                          {' '}&rarr;{' '}
                          {log.direction === 'shopify_to_bsale' ? 'Bsale' : 'Shopify'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {log.new_quantity} ({log.delta > 0 ? '+' : ''}{log.delta})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/products" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <CubeIcon className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Map Products</p>
                <p className="text-xs text-gray-500">Link Shopify products to Bsale</p>
              </div>
            </a>
            <a href="/documents" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">View Documents</p>
                <p className="text-xs text-gray-500">See all generated documents</p>
              </div>
            </a>
            <a href="/stock-sync" className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowPathIcon className="w-6 h-6 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Sync Stock</p>
                <p className="text-xs text-gray-500">Manually sync inventory</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}