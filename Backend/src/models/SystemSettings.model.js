import mongoose from 'mongoose';
import { jsonTransform, toObjectOptions } from '../utils/schema.util.js';

const { Schema } = mongoose;

const systemSettingsSchema = new Schema(
  {
    singletonKey: {
      type: String,
      default: 'singleton',
      unique: true,
      select: false, // Don't return it in queries
    },
    platformFeePercent: {
      type: Number,
      default: 10,
      min: [0, 'Platform fee percent cannot be negative'],
      max: [100, 'Platform fee percent cannot exceed 100'],
    },
    minWithdrawalRupees: {
      type: Number,
      default: 1000,
      min: [0, 'Minimum withdrawal cannot be negative'],
    },
    queryTokenPriceRupees: {
      type: Number,
      default: 20,
      min: [1, 'Token price must be at least 1 rupee'],
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: jsonTransform,
    toObject: toObjectOptions,
  }
);

systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    try {
      settings = await this.create({});
    } catch (err) {
      // Handle potential race conditions during concurrent bootstrap
      settings = await this.findOne();
    }
  }
  return settings;
};

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
