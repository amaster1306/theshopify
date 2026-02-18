import React from 'react';
import { useShop } from '../contexts/ShopContext';
import { 
  CogIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function Configuration() {
  const { shop, refetchShop } = useShop();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure how the app works with your Shopify store and Bsale account.
        </p>
      </div>

      {/* Document Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <DocumentTextIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Document Generation</h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-generate documents</p>
              <p className="text-sm text-gray-500">Automatically create documents for new orders</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
              <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Default Document Type</label>
            <select className="form-input">
              <option value="boleta">Boleta Electrónica</option>
              <option value="factura">Factura Electrónica</option>
              <option value="nota_venta">Nota de Venta</option>
            </select>
            <p className="form-hint">This will be used when customer RUT is not available</p>
          </div>
        </div>
      </div>

      {/* Stock Sync Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <ArrowPathIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Stock Synchronization</h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable stock sync</p>
              <p className="text-sm text-gray-500">Synchronize inventory between Shopify and Bsale</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
              <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Sync Direction</label>
            <select className="form-input">
              <option value="bidirectional">Bidirectional (Both ways)</option>
              <option value="shopify_to_bsale">Shopify to Bsale only</option>
              <option value="bsale_to_shopify">Bsale to Shopify only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Sync Interval</label>
            <select className="form-input">
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <BellIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Error notifications</p>
              <p className="text-sm text-gray-500">Get notified when document generation fails</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
              <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Notification Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="your@email.com"
            />
            <p className="form-hint">Leave empty to use the store email</p>
          </div>
        </div>
      </div>

      {/* Bsale Connection */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <CogIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Bsale Connection</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="bg-green-50 p-4 rounded-lg flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Connected to Bsale</p>
              <p className="text-xs text-green-600">Branch ID: {shop?.bsaleBranchId || 'Not set'}</p>
            </div>
          </div>
          
          <button className="btn-secondary mt-4">
            Reconfigure Bsale Connection
          </button>
        </div>
      </div>
    </div>
  );
}