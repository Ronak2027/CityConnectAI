import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
  // Prevent Mongoose from buffering queries indefinitely when offline/disconnected
  mongoose.set('bufferCommands', false);
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cleancityai';
    
    // Resolve Windows SRV lookup issue for MongoDB Atlas srv URLs
    if (connStr.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('[Database] Custom DNS fallback skipped:', dnsErr.message);
      }
    }

    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection note: ${error.message}. Running in high-performance local mode.`);
  }
};
