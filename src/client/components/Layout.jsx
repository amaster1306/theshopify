import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useShop, usePlanStatus } from '../contexts/ShopContext';
import { 
  HomeIcon, 
  CogIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  DocumentTextIcon,
  ArrowPathIcon,
  CreditCardIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Configuration', href: '/configuration', icon: CogIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Stock Sync', href: '/stock-sync', icon: ArrowPathIcon },
  { name: 'Plans', href: '/plans', icon: CreditCardIcon },
  { name: 'Settings', href: '/settings', icon: AdjustmentsHorizontalIcon },
];

export default function Layout() {
  const { shop } = useShop();
  const { isTrial, trialDaysRemaining, needsPayment } = usePlanStatus();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-semibold text-gray-900">Bsale Integration</span>
            </div>
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  nav-item
                  ${isActive ? 'nav-item-active' : ''}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Plan status */}
          <div className="p-4 border-t border-gray-200">
            {isTrial && trialDaysRemaining > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Trial:</span> {trialDaysRemaining} days remaining
                </p>
                <NavLink 
                  to="/plans" 
                  className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
                >
                  Upgrade now
                </NavLink>
              </div>
            )}
            {needsPayment && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Action required:</span> Payment needed
                </p>
                <NavLink 
                  to="/plans" 
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Update payment
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200">
          <button
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-6 h-6 text-gray-500" />
          </button>

          <div className="flex-1" />

          {/* Shop name */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{shop?.name || shop?.domain}</span>
            
            {/* Notifications */}
            <button className="btn-icon relative">
              <BellIcon className="w-5 h-5 text-gray-500" />
              {/* Notification badge */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /> */}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}