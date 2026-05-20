import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { prisma } from './utils/prisma';
import { startAllNotificationJobs, setIoInstance } from './services/notification.service';
import { startSoftDeleteCleanupJob } from './services/cleanup.service';

dotenv.config();

const PORT = process.env.PORT || 5001; // Port for the API server

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with your frontend URL.
    methods: ['GET', 'POST']
  }
});

setIoInstance(io);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected via Prisma');
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      startAllNotificationJobs();
      startSoftDeleteCleanupJob();
    });
    
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export the Express app for Vercel Serverless compatibility if needed
export default app;
