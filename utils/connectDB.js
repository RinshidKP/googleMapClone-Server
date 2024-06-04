import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI
export const connectToDatabase = async () => {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  };