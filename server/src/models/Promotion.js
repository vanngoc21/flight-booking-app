const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    titleEn: { type: String, default: '', trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true, maxlength: 500 },
    descriptionEn: { type: String, default: '', trim: true, maxlength: 500 },
    campaignType: {
      type: String,
      enum: ['coupon', 'event'],
      default: 'coupon',
    },
    eventTitle: { type: String, default: '', trim: true, maxlength: 100 },
    eventTitleEn: { type: String, default: '', trim: true, maxlength: 100 },
    bannerImageUrl: { type: String, default: '', trim: true, maxlength: 2048 },
    airlineCode: { type: String, default: '', trim: true, uppercase: true, maxlength: 10 },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    maxDiscount: { type: Number, default: null, min: 1 },
    minimumBaseFare: { type: Number, default: 0, min: 0 },
    applicability: {
      type: String,
      enum: ['all', 'domestic', 'international'],
      default: 'all',
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    active: { type: Boolean, default: true },
    seeded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

promotionSchema.index({ active: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
