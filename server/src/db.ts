import mongoose from "mongoose";

// const MONGO_URI = "mongodb://127.0.0.1:27017/booking_ruangan"; 

// 👉 ganti kalau pakai Mongo Atlas

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}
