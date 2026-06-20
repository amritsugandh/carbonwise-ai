require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { seedChallenges } = require('./controllers/challengeController');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Firebase Admin
    initializeFirebase();

    // Seed initial data
    await seedChallenges();

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`CarbonWise API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      try {
        await require('mongoose').connection.close();
        logger.info('MongoDB connection closed');
      } catch (dbErr) {
        logger.error(`Error closing MongoDB: ${dbErr.message}`);
      }
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
