import { storage } from "./storage";
import { seedData } from "./data-seeder";

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // If using in-memory storage, seed the data
    if (!process.env.DATABASE_URL) {
      console.log('Using in-memory storage, seeding data...');
      await seedData();
      console.log('Database initialized with seed data');
    } else {
      console.log('Using database storage');
      // In production, you would run migrations here
      // await migrate();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}