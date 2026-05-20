import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

const app: Application = express();

// Ensure upload directories exist
if (!process.env.VERCEL) {
  const uploadDirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'aadhar'),
    path.join(process.cwd(), 'uploads', 'signed-copies')
  ];
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://172.16.0.164:3000', 'http://172.16.0.164:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(morgan('dev'));

// Routes
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import clientsRoutes from './routes/clients.routes';
import inquiriesRoutes from './routes/inquiries.routes';
import videoRoutes from './routes/video.routes';
import ledRoutes from './routes/led.routes';
import soundRoutes from './routes/sound.routes';
import availabilityRoutes from './routes/availability.routes';
import staffRoutes from './routes/staff.routes';
import quotationsRoutes from './routes/quotations.routes';
import assignmentsRoutes from './routes/assignments.routes';
import invoicesRoutes from './routes/invoices.routes';
import expenseRoutes from './routes/expense.routes';
import vehiclesRoutes from './routes/vehicles.routes';
import dispatchRoutes from './routes/dispatch.routes';
import pdfRoutes from './routes/pdf.routes';
import notificationsRoutes from './routes/notifications.routes';
import analyticsRoutes from './routes/analytics.routes';
import warehouseRoutes from './routes/warehouse.routes';
import officeRoutes from './routes/office.routes';
import vendorsRoutes from './routes/vendors.routes';
import rolesRoutes from './routes/roles.routes';

// Test Route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'BK Media CRM API is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/inquiries', inquiriesRoutes);
app.use('/api/v1/video', videoRoutes);
app.use('/api/v1/led', ledRoutes);
app.use('/api/v1/sound', soundRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/quotations', quotationsRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/expense-reports', expenseRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/pdf', pdfRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/warehouse', warehouseRoutes);
app.use('/api/v1/office', officeRoutes);
app.use('/api/v1/vendors', vendorsRoutes);
app.use('/api/v1/roles', rolesRoutes);

export default app;
