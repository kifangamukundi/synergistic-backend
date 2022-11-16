import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    images: [String],
    isActive: { type: Boolean, default: false, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    isModerator: { type: Boolean, default: false, required: true },
    isFieldAgent: { type: Boolean, default: false, required: true },
    isFarmer: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
