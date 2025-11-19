// models/Asset.ts
import mongoose, { Schema, model, models } from "mongoose";

const AssetSchema = new Schema({
  name: { type: String, required: true },
  empId: { type: String, required: true },
  selectedTeamCategory: { type: String },
  team: { type: String },
  designation: { type: String },
  deviceType: { type: String },
  laptopModel: { type: String },
  serialNumber: { type: String },
  processor: { type: String },
  storage: { type: String },
  ram: { type: String },
  os: { type: String },
  antivirus: { type: String },
  purchaseDate: { type: String },
  allAccessories: { type: [String], default: [] },
}, { timestamps: true });

// Prevent model recompilation in dev (Next.js hot reload)
const Asset = models.Asset || model("Asset", AssetSchema);
export default Asset;
