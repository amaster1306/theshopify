import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/index.css';

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Get shop from URL params
const urlParams = new URLSearchParams(window.location.search);
const shop = urlParams.get('shop');

// Initialize Shopify App Bridge if embedded
if (window.top !== window.self && shop) {
  // We're in an iframe (embedded app)
  // Load Shopify App Bridge
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@shopify/app-bridge@3/umd/index.js';
  script.onload = () => {
    const { createApp } = window['app-bridge'];
    const { TitleBar, Button } = window['app-bridge/actions'];
    
    const app = createApp({
      apiKey: document.querySelector('meta[name="shopify-api-key"]')?.content || '',
      shopOrigin: shop,
      host: urlParams.get('host') || btoa(`${shop}/admin`),
    });
    
    window.shopifyApp = app;
    
    // Create title bar
    const titleBar = TitleBar.create(app, {
      title: 'Bsale Integration',
    });
  };
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById('app-root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);