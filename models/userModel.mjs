import mongoose from 'mongoose';

const { MONGODB_URI } = process.env;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  verified: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['1212', '1313'], 
    default: '1212'
  },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

export default User;