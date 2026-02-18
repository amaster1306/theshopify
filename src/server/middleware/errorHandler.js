/**
 * Error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Authentication required',
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'Access denied',
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'Not found',
      message: err.message || 'Resource not found',
    });
  }

  // Shopify API errors
  if (err.response?.status) {
    const status = err.response.status;
    const message = err.response.data?.errors || err.message;
    
    if (status === 401 || status === 403) {
      return res.status(status).json({
        error: 'Shopify API error',
        message: 'Failed to authenticate with Shopify',
      });
    }

    if (status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Shopify API',
      });
    }

    return res.status(status).json({
      error: 'Shopify API error',
      message: typeof message === 'string' ? message : JSON.stringify(message),
    });
  }

  // Bsale API errors
  if (err.config?.baseURL?.includes('bsale')) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error || err.message;

    return res.status(status).json({
      error: 'Bsale API error',
      message: typeof message === 'string' ? message : JSON.stringify(message),
    });
  }

  // Supabase errors
  if (err.code?.startsWith('PGRST')) {
    return res.status(400).json({
      error: 'Database error',
      message: err.message,
      code: err.code,
    });
  }

  // Default error
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(status).json({
    error: 'Internal server error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Async handler wrapper
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
};