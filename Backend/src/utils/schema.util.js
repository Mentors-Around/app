import mongoose from "mongoose";

const { Schema } = mongoose;

export const jsonTransform = {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
};

export const toObjectOptions = {
  virtuals: true,
  versionKey: false,
};

export const auditSchema = new Schema(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: "" },
    adminAction: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

export const geoPointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      validate: {
        validator(v) {
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 && v[0] <= 180 &&
            v[1] >= -90 && v[1] <= 90
          );
        },
        message: "Invalid GeoJSON coordinates [lng, lat]",
      },
    },
  },
  { _id: false }
);

/** Always store monetary values in PAISE */
export function moneyField(opts = {}) {
  return {
    type: Number,
    min: [0, "Amount cannot be negative"],
    default: 0,
    ...opts,
  };
}

export const phoneValidator = {
  validator: (v) => /^\+?[1-9]\d{9,14}$/.test(v),
  message: (props) => `${props.value} is not a valid phone number`,
};

export const urlValidator = {
  validator: (v) => !v || /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(v),
  message: "Must be a valid URL",
};

export function enumField(enumObj, defaultVal, required = true) {
  return {
    type: String,
    enum: { values: Object.values(enumObj), message: "{VALUE} is not a valid value" },
    default: defaultVal,
    required,
  };
}

export const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  return new Date() > new Date(expiryDate);
};

export function applySchemaPlugins(schema, plugins = []) {
  plugins.forEach((p) => {
    if (Array.isArray(p)) schema.plugin(p[0], p[1]);
    else schema.plugin(p);
  });
}

export { defaultPaginateOptions } from "./pagination.util.js";

