import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({ 
  name: { type: String, required: true },
  empId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["Admin", "Manager", "Team Lead", "Employee"], 
    required: true,
    default: "Employee"
  },
});

const User = models.User || mongoose.model("User", userSchema);

export default User;