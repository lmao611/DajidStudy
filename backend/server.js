import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import profileRoutes from './routes/profileRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import vocabRoutes from './routes/vocabRoutes.js';

import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DajidStudy Backend Service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mounting API Routes
app.use('/api/profile', profileRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/vocabularies', vocabRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 [DajidStudy Server] Backend API đang chạy tại: http://localhost:${PORT}`);
  console.log(`📌 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📌 Profile API: http://localhost:${PORT}/api/profile`);
  console.log(`📌 Schedules API: http://localhost:${PORT}/api/schedules`);
  console.log(`📌 Vocabularies API: http://localhost:${PORT}/api/vocabularies\n`);
});
