import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhooks.js';
import apiRoutes from './routes/api.js';
import billingRoutes from './routes/billing.js';

// Import middleware
import { verifyShopifySession } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import services
import { initSupabase } from './services/supabase.js';
import { initShopify } from './services/shopify.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
initSupabase();
initShopify();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self", "https://admin.shopify.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.bsale.cl", process.env.SUPABASE_URL].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: [
    'https://admin.shopify.com',
    'https://*.myshopify.com',
    process.env.SHOPIFY_APP_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Webhook rate limiting (more lenient)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Shopify can send many webhooks
});
app.use('/webhooks/', webhookLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/webhooks', webhookRoutes);

// Protected routes (require Shopify session)
app.use('/api', verifyShopifySession, apiRoutes);
app.use('/api/billing', verifyShopifySession, billingRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
  
  // Handle SPA routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
      return next();
    }
    res.sendFile('index.html', { root: 'dist/client' });
  });
}

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;