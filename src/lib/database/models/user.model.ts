import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["admin", "researcher", "guest"],
      default: "guest",
    },
    fullname: {
      type: String,
      unique: false,
      required: false,
    },
    photo: {
      type: String,
      required: true,
    },
    firstName: { type: String },
    lastName: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    userBio: {
      type: String,
      default: "",
    },

    // persisted theme preference
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "light",
    },

    verificationToken: String,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  },
);

const user = models?.user || model("user", UserSchema);

export default user;