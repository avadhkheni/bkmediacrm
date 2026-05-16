import { prisma } from '../utils/prisma';

export const startSoftDeleteCleanupJob = () => {
  // Run every 24 hours
  setInterval(async () => {
    try {
      console.log('Running soft-delete cleanup job...');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // List of models that have soft delete
      const models = [
        'client',
        'staff',
        'inquiry',
        'videoEquipment',
        'ledStock',
        'vehicle',
        'user'
      ];

      for (const model of models) {
        const result = await (prisma as any)[model].deleteMany({
          where: {
            deletedAt: {
              lt: thirtyDaysAgo,
              not: null
            }
          }
        });
        if (result.count > 0) {
          console.log(`Cleaned up ${result.count} records from ${model}`);
        }
      }
      
      console.log('Soft-delete cleanup job completed.');
    } catch (error) {
      console.error('Error in soft-delete cleanup job:', error);
    }
  }, 24 * 60 * 60 * 1000); 

  // Run once on startup (optional, but good for immediate cleanup if server restarted)
  setTimeout(() => {
    // We could run it here, but maybe best to wait a bit after startup
  }, 5000);
};
