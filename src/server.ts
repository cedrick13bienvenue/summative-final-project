import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './database/config/database';
import './models'; 
import { routers } from './routes';
import { swaggerRouter } from './routes/swaggerRoutes';
import { sanitizeInput } from './middleware/validation';
import { basicRateLimiter, rateLimitMonitor } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;
const IS_DOCS_ONLY = process.env['DOCS_ONLY'] === 'true';

app.use(cors());
app.use(express.json());
app.use(sanitizeInput);
app.use(basicRateLimiter);
app.use(rateLimitMonitor);
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MedConnect Server is running',
    mode: IS_DOCS_ONLY ? 'docs-only' : 'full-api'
  });
});

// Serve Swagger UI at /api/v1/docs - ALWAYS ACTIVE
app.use('/api/v1', swaggerRouter);

// API routes
app.use('/api/v1', routers);

// Root redirect for easy access
app.get('/', (_req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h1>MedConnect API Documentation</h1>
      <p>The interactive API documentation is ready and available.</p>
      <a href="/api/v1/docs" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Enter API Documentation</a>
    </div>
  `);
});

const startServer = async () => {
  try {
    // Attempt database connection but DON'T crash if it fails
    console.log('📡 Checking database connection...');
    await connectDatabase().catch(err => {
      console.error('⚠️ Database connection failed, but starting server anyway for documentation access.');
    });
    
    app.listen(PORT, () => {
      console.log(`🚀 MedConnect server running on port ${PORT}`);
      console.log(`📚 Interactive Documentation: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    console.error('❌ Critical failure during startup:', error);
    process.exit(1);
  }
};

startServer();

export default app;