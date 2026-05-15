import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import pollRoutes from './modules/poll/poll.routes.js';
import responseRoutes from './modules/response/response.routes.js';
import ApiError from './common/utils/api-error.js';

const app = express();

// Middlewares
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/responses', responseRoutes);

// 404 handler
app.use((req, res, next) => {
    next(ApiError.notFound(`Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        status: 'error',
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;