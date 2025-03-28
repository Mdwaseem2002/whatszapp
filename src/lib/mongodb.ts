import mongoose from 'mongoose';

// Ensure MONGODB_URI is defined at runtime
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

interface CachedMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Use a type assertion to ensure global is treated correctly
const globalWithMongoose = global as typeof global & {
  mongoose?: CachedMongoose;
};

// Initialize cached connection
const cached: CachedMongoose = globalWithMongoose.mongoose || { conn: null, promise: null };

// Store in global to persist across serverless function invocations
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

async function connectMongoDB(): Promise<mongoose.Connection> {
  // Type assertion to ensure MONGODB_URI is a string
  const mongoUri = MONGODB_URI as string;

  // If connection exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // Create connection if no existing promise
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      socketTimeoutMS: 30000,
      retryWrites: true,
    };

    // Use type assertion to ensure string type
    cached.promise = mongoose.connect(mongoUri, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectMongoDB;