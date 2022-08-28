import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    response: { type: Object, required: true },
  },
  {
    timestamps: true,
  }
);

const surveySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    surveyJson: { type: Object, required: true },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true, required: true },
    category: { type: String, required: true },
    numResponses: { type: Number, required: true },
    responses: [responseSchema],
  },
  {
    timestamps: true,
  }
);

const Survey = mongoose.model('Survey', surveySchema);
export default Survey;
