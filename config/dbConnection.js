import mongoose from "mongoose";

const url = "mongodb+srv://huraira:Usama10091@cluster0.hnawam1.mongodb.net/LMS";

export const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    const conn = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
