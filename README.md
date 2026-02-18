# Shopify Bsale Integration App

A standardized Shopify application for integrating Shopify stores with Bsale (Chilean billing system). This app enables automatic document generation (boletas, facturas, notas de venta) and bidirectional stock synchronization.

## Features

- **Document Generation**: Automatically generate Chilean tax documents (Boleta, Factura, Nota de Venta) for Shopify orders
- **Stock Synchronization**: Bidirectional inventory sync between Shopify and Bsale
- **Product Mapping**: Map Shopify products to Bsale products
- **Subscription Plans**: Multiple pricing tiers with usage limits
- **Real-time Webhooks**: Process Shopify events in real-time

## Tech Stack

- **Frontend**: React 18 with Vite (no Remix)
- **Backend**: Express.js
- **Database**: Supabase (PostgreSQL)
- **APIs**: Shopify Admin API, Bsale API
- **Billing**: Stripe (or Polar)

## Prerequisites

- Node.js 18+
- npm or yarn
- Shopify Partner account
- Supabase account
- Bsale account with API access
- Stripe account (for billing)

## Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd shopify-bsale-app
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SHOPIFY_API_KEY` - From Shopify Partner Dashboard
- `SHOPIFY_API_SECRET` - From Shopify Partner Dashboard
- `SHOPIFY_APP_URL` - Your app's public URL
- `SUPABASE_URL` - From Supabase project settings
- `SUPABASE_ANON_KEY` - From Supabase project settings
- `SUPABASE_SERVICE_KEY` - From Supabase project settings (service role)
- `SESSION_SECRET` - Random string for session encryption

### 3. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Open supabase/schema.sql and run it in Supabase dashboard
```

### 4. Development

```bash
npm run dev
```

This starts both the server (port 3000) and Vite dev server (port 5173).

### 5. Production Build

```bash
npm run build
npm start
```

## Project Structure

```
shopify-bsale-app/
âââ src/
âÂ âÂ âÂ âÂ âââ client/                 # React frontend
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ components/         # Reusable components
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ contexts/           # React contexts
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ pages/              # Page components
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ services/           # API services
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ styles/             # CSS styles
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ App.jsx
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ main.jsx
âÂ âÂ âÂ âÂ âââ server/                 # Express backend
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ middleware/        # Express middleware
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ routes/            # API routes
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ services/          # Business logic
âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âÂ âââ index.js
âÂ âÂ âÂ âÂ âââ types/                 # TypeScript types
âââ supabase/
âÂ âÂ âÂ âÂ âââ schema.sql            # Database schema
âââ .env.example
âââ package.json
âââ shopify.app.toml        # Shopify app config
âââ vite.config.js
âââ tailwind.config.js
âââ README.md
```

## API Endpoints

### Authentication
- `GET /api/auth/start` - Begin OAuth flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/session` - Get current session

### Shop
- `GET /api/shop` - Get shop info
- `PATCH /api/shop` - Update shop settings
- `POST /api/shop/bsale-config` - Configure Bsale credentials

### Products
- `GET /api/products` - Get Shopify products
- `GET /api/products/mappings` - Get product mappings
- `POST /api/products/mappings` - Create product mapping
- `GET /api/bsale/products` - Search Bsale products

### Orders
- `GET /api/orders` - Get Shopify orders
- `GET /api/orders/:id` - Get order details

### Documents
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/pdf` - Download PDF

### Stock Sync
- `GET /api/stock-sync/logs` - Get sync history
- `POST /api/stock-sync/sync` - Manual sync

### Billing
- `GET /api/billing/plans` - Get available plans
- `GET /api/billing/subscription` - Get current subscription
- `POST /api/billing/checkout` - Create checkout session

### Webhooks
- `POST /webhooks/orders/create` - Order created
- `POST /webhooks/orders/updated` - Order updated
- `POST /webhooks/orders/cancelled` - Order cancelled
- `POST /webhooks/products/create` - Product created
- `POST /webhooks/products/update` - Product updated
- `POST /webhooks/inventory_levels/update` - Inventory updated
- `POST /webhooks/app/uninstalled` - App uninstalled

## Deployment

### Docker

```bash
docker build -t shopify-bsale-app .
docker run -p 3000:3000 --env-file .env shopify-bsale-app
```

### Vercel

The app includes a `vercel.json` for easy deployment:

```bash
vercel --prod
```

### Railway/Render

1. Connect your repository
2. Set environment variables
3. Deploy with build command: `npm run build`
4. Start command: `npm start`

## Subscription Plans

The app includes three default plans:

| Plan | Monthly | Yearly | Orders | Documents | Features |
|------|---------|--------|--------|-----------|----------|
| Starter | $19 | $190 | 100 | 100 | Boletas, Stock sync (60min) |
| Professional | $49 | $490 | 500 | 500 | All documents, Stock sync (15min), Priority support |
| Business | $99 | $990 | Unlimited | Unlimited | All features, Stock sync (5min), Custom branding |

## Development Notes

### Shopify App Bridge

The app uses Shopify App Bridge for embedded app functionality. The session is managed through Supabase instead of Shopify's session storage.

### Bsale API

Bsale API documentation: https://api.bsale.cl/v1/docs

Key endpoints used:
- `/documents.json` - Create documents
- `/products.json` - Get products
- `/stocks.json` - Update stock
- `/clients.json` - Manage clients

### Chilean Tax Documents

- **Boleta Electrónica** (SII Code 39): For B2C sales
- **Factura Electrónica** (SII Code 33): For B2B sales (requires RUT)
- **Nota de Venta** (SII Code 41): Internal sales document
- **Nota de Crédito** (SII Code 61): For refunds/cancellations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@yourcompany.com or open an issue in this repository.