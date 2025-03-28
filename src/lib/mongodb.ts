//src\lib\mongodb.ts
import mongoose from 'mongoose';

// Extend the global interface to include our custom mongoose property
interface CustomGlobal {
  mongoose?: {
    conn: mongoose.Connection | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Extend the global object with our custom interface
declare const globalThis: CustomGlobal & typeof global;

// Ensure MONGODB_URI is a non-empty string
function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MongoDB URI is not defined');
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }
  
  return uri;
}

// Create a timeout promise
function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Connection timeout after ${ms}ms`)), ms)
  );
}

// Create a singleton connection function
async function connectMongoDB(): Promise<mongoose.Connection> {
  // Use global object to cache connection
  const cached = globalThis.mongoose ?? { conn: null, promise: null };
  
  // If connection exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // Get MongoDB URI (will throw if not defined)
  const MONGODB_URI = getMongoURI();

  // If no existing promise, create a new connection
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 20000, // Reduced timeout
      socketTimeoutMS: 30000, // Reduced timeout
      connectTimeoutMS: 30000, // Added connect timeout
      retryWrites: true,
      w: 'majority'
    };

    cached.promise = Promise.race([
      mongoose.connect(MONGODB_URI, opts)
        .then((mongooseConnection) => {
          console.log('MongoDB connected successfully');
          cached.conn = mongooseConnection.connection;
          globalThis.mongoose = cached;
          return mongooseConnection;
        })
        .catch((error) => {
          console.error('MongoDB connection error:', error);
          cached.promise = null;
          throw error;
        }),
      createTimeoutPromise(25000) // 25 seconds timeout
    ]);
  }

  try {
    await cached.promise;

    if (!cached.conn) {
      throw new Error('Connection could not be established');
    }

    return cached.conn;
  } catch (e) {
    console.error('Failed to connect to MongoDB:', e);
    cached.promise = null;
    
    // More detailed error logging
    if (e instanceof Error) {
      console.error('Error details:', {
        message: e.message,
        name: e.name,
        stack: e.stack
      });
    }

    throw e;
  }
}

// Explicitly define a default export
export default connectMongoDB;