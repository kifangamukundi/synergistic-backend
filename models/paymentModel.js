import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    customer_number: { type: String, required: true },
    mpesa_ref: { type: String, required: true },
    amount: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;