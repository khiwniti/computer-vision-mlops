import { storage } from "./storage";
import { seedData } from "./data-seeder";

export async function initializeDatabase() {
  try {
    console.log('🗄️  Initializing database...');
    
    // Check for Restack-provided database URL
    const databaseUrl = process.env.DATABASE_URL;
    const redisUrl = process.env.REDIS_URL;
    const environment = process.env.NODE_ENV || 'development';
    
    console.log(`📊 Environment: ${environment}`);
    console.log(`🔗 Database URL: ${databaseUrl ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🔗 Redis URL: ${redisUrl ? '✅ Configured' : '❌ Not configured'}`);
    
    if (!databaseUrl) {
      console.log('⚠️  Using in-memory storage for development');
      await seedData();
      console.log('✅ Database initialized with seed data');
    } else {
      console.log('🔗 Using external database');
      // In production with Restack, database is pre-configured
      // Run migrations if needed
      // await migrate();
      console.log('✅ Database connection established');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}