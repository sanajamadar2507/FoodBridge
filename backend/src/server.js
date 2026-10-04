const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { startCronJobs } = require('./services/cron.service');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration supporting production origins and local development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, or same-origin requests without Origin header
      if (!origin) return callback(null, true);
      // In development or when wildcard configured
      if (!allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'FoodBridge API Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/listings', require('./routes/listings.routes'));
app.use('/api/claims', require('./routes/claims.routes'));
app.use('/api/pickups', require('./routes/pickups.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));

// Global 404
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server if launched directly as main script
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 FoodBridge REST API Server running on port ${PORT}`);
    console.log(`==================================================`);
    startCronJobs();
  });
}

module.exports = app;
