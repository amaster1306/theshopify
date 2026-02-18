import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ShopContext } from './contexts/ShopContext';
import { getShopInfo } from './services/api';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Configuration = React.lazy(() => import('./pages/Configuration'));
const Products = React.lazy(() => import('./pages/Products'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Documents = React.lazy(() => import('./pages/Documents'));
const StockSync = React.lazy(() => import('./pages/StockSync'));
const Plans = React.lazy(() => import('./pages/Plans'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Setup = React.lazy(() => import('./pages/Setup'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  const [searchParams] = useSearchParams();
  const shopDomain = searchParams.get('shop');
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch shop info
  const { 
    data: shopData, 
    isLoading, 
    error, 
    refetch: refetchShop 
  } = useQuery(
    ['shop'],
    () => getShopInfo(shopDomain),
    {
      enabled: !!shopDomain,
      retry: false,
      onSuccess: () => setIsInitialized(true),
      onError: () => setIsInitialized(true),
    }
  );

  // Check if app is embedded in Shopify
  useEffect(() => {
    if (window.top !== window.self) {
      // Embedded in Shopify admin
      document.body.classList.add('embedded');
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Error state - shop not found
  if (error && !shopData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            App Not Installed
          </h1>
          <p className="text-gray-600 mb-6">
            Please install the app from the Shopify App Store.
          </p>
          {shopDomain && (
            <a
              href={`/api/auth/start?shop=${shopDomain}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-shopify-green hover:bg-green-700"
            >
              Install App
            </a>
          )}
        </div>
      </div>
    );
  }

  // Check if Bsale is configured
  const isBsaleConfigured = shopData?.bsaleConfigured || false;
  const planStatus = shopData?.planStatus || 'trial';

  return (
    <ShopContext.Provider value={{ 
      shop: shopData, 
      refetchShop,
      isBsaleConfigured,
      planStatus,
    }}>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoadingSpinner size="large" />
          </div>
        }>
          <Routes>
            {/* Setup route for initial Bsale configuration */}
            {!isBsaleConfigured ? (
              <>
                <Route path="/setup" element={<Setup />} />
                <Route path="*" element={<Navigate to="/setup" replace />} />
              </>
            ) : (
              <>
                {/* Main app routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="configuration" element={<Configuration />} />
                  <Route path="products" element={<Products />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="stock-sync" element={<StockSync />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </>
            )}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ShopContext.Provider>
  );
}

export default App;