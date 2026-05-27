import mongoose from 'mongoose';
import { config } from './env.config';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    mongoose.connection.on('disconnected', () =>
      console.warn('MongoDB disconnected')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('MongoDB reconnected')
    );
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};
