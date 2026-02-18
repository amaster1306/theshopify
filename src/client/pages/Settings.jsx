import React from 'react';
import { useShop } from '../contexts/ShopContext';
import { 
  BuildingStorefrontIcon,
  KeyIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { shop, refetchShop } = useShop();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your app settings and preferences.
        </p>
      </div>

      {/* Store Information */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Store Information</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Store Name</p>
              <p className="font-medium text-gray-900">{shop?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Domain</p>
              <p className="font-medium text-gray-900">{shop?.domain || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{shop?.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Currency</p>
              <p className="font-medium text-gray-900">{shop?.currency || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Timezone</p>
              <p className="font-medium text-gray-900">{shop?.timezone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Installed</p>
              <p className="font-medium text-gray-900">
                {shop?.installedAt ? new Date(shop.installedAt).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bsale Connection */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center">
            <KeyIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Bsale Connection</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${shop?.bsaleConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium text-gray-900">
                  {shop?.bsaleConfigured ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-sm text-gray-500">
                  {shop?.bsaleConfigured ? 'Your Bsale account is linked' : 'Set up your Bsale connection'}
                </p>
              </div>
            </div>
            <button className="btn-secondary btn-sm">
              Reconfigure
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <div className="card-header bg-red-50">
          <div className="flex items-center">
            <TrashIcon className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Uninstall App</p>
              <p className="text-sm text-gray-500">
                Remove the app from your store. This action cannot be undone.
              </p>
            </div>
            <button className="btn-danger btn-sm">
              Uninstall
            </button>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900">Need Help?</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="#"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Documentation</h4>
              <p className="text-sm text-gray-500 mt-1">
                Learn how to set up and use the app
              </p>
            </a>
            <a 
              href="#"
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Support</h4>
              <p className="text-sm text-gray-500 mt-1">
                Contact our team for assistance
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}