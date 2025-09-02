const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  plan: { type: String, enum: ['paid', 'premium', 'custom'], required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentHistory: [{
    amount: Number,
    date: Date,
    gateway: String,
    transactionId: String,
  }],
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
