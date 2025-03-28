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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Type-safe cached connection
function getMongooseCache(): NonNullable<CustomGlobal['mongoose']> {
  if (!globalThis.mongoose) {
    globalThis.mongoose = {
      conn: null,
      promise: null
    };
  }
  return globalThis.mongoose;
}

async function connectMongoDB(): Promise<mongoose.Connection> {
  const cached = getMongooseCache();

  // If connection exists, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If no existing promise, create a new connection
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      // Remove deprecated options
      // useNewUrlParser and useUnifiedTopology are now always true in newer Mongoose versions
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseConnection) => {
      // Store the connection
      cached.conn = mongooseConnection.connection;
      return mongooseConnection;
    });
  }

  try {
    // Await the connection promise
    await cached.promise;
    
    // Ensure conn is not null (type safety)
    if (!cached.conn) {
      throw new Error('Connection could not be established');
    }

    return cached.conn;
  } catch (e) {
    // Reset the promise on error
    cached.promise = null;
    throw e;
  }
}

export default connectMongoDB;