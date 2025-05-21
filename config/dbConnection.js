import mongoose from 'mongoose';

mongoose.set("strictQuery", false);

let isConnected = false; // Global connection cache

const connectionToDB = async () => {
  if (isConnected) {
    // Already connected
    return;
  }

  try {
    const db = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb+srv://huraira:Usama10091@cluster0.hnawam1.mongodb.net/LMS",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
      }
    );

    isConnected = db.connections[0].readyState === 1;

    if (isConnected) {
      console.log(`✅ Connected to MongoDB: ${db.connection.host}`);
    } else {
      console.log("⚠️ Not connected to MongoDB");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectionToDB;
