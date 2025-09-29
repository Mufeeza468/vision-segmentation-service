import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { database } from './config/database';

// Import routes
import annotationRoutes from './routes/annotations';
import projectRoutes from './routes/projects';
import imageRoutes from './routes/images';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perle_segmentation';

// Extract database name from URI
const dbName = MONGODB_URI.split('/').pop() || 'perle_segmentation';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Large limit for image data and masks
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/annotations', annotationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/images', imageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Perle AI Segmentation API',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Perle AI Segmentation System API',
    version: '1.0.0',
    endpoints: {
      annotations: '/api/annotations',
      projects: '/api/projects',
      images: '/api/images',
      health: '/health'
    },
    documentation: 'See MODEL.md for data model documentation'
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await database.connect(MONGODB_URI, dbName);
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Perle AI Segmentation API running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
      console.log(`💚 Health check available at http://localhost:${PORT}/health`);
      console.log(`🗂️  Data model documented in MODEL.md`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();