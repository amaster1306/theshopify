import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useShop } from '../contexts/ShopContext';
import { getOrders } from '../services/api';
import { 
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { LoadingCard } from '../components/LoadingSpinner';

export default function Orders() {
  const { shop } = useShop();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('any');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery(
    ['orders', statusFilter],
    () => getOrders({ limit: 50, status: statusFilter })
  );

  const orders = ordersData?.orders || [];

  // Filter orders by search
  const filteredOrders = orders.filter(order => 
    order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStatusBadge = (financialStatus) => {
    const statusMap = {
      paid: 'badge-success',
      pending: 'badge-warning',
      refunded: 'badge-error',
      partially_refunded: 'badge-info',
      voided: 'badge-gray',
    };
    return statusMap[financialStatus] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          View orders from your Shopify store and their document status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="form-input pl-10"
            placeholder="Search by order number, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="any">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <LoadingCard />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{order.name}</p>
                        <p className="text-xs text-gray-500">{order.order_number}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-gray-900">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(order.total_price, order.currency)}
                      </p>
                    </td>
                    <td>
                      <span className={getStatusBadge(order.financial_status)}>
                        {order.financial_status}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="text-right">
                      <button 
                        className="btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal">
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)} />
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900">
                Order {selectedOrder.name}
              </h3>
            </div>

            <div className="modal-body space-y-4">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Customer</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">
                    {selectedOrder.customer?.first_name} {selectedOrder.customer?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedOrder.customer?.email}</p>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.line_items?.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.price, selectedOrder.currency)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal_price, selectedOrder.currency)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatCurrency(selectedOrder.total_tax, selectedOrder.currency)}</span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_price, selectedOrder.currency)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              <button className="btn-primary">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                Generate Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}