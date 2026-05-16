import app from './app';
import dotenv from 'dotenv';
import { prisma } from './utils/prisma';
import { startAllNotificationJobs } from './services/notification.service';
import { startSoftDeleteCleanupJob } from './services/cleanup.service';

dotenv.config();

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL database connected via Prisma');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      startAllNotificationJobs();
      startSoftDeleteCleanupJob();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
