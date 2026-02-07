import { Schema, model, models } from "mongoose";

// upload events schema
const UploadEventSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    proteinType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileFormat: {
      type: String,
      enum: ["pdb", "csv", "fasta", "fa"],
      required: true,
    },
    uploadStatus: {
      type: String,
      enum: ["success", "failed", "processing"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// binding prediction schema
const BindingPredictionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    proteinId: {
      type: String,
      required: true,
    },
    proteinName: {
      type: String,
      required: true,
    },
    successScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    bindingAffinity: {
      type: Number,
      required: false,
    },
    predictionStatus: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

// user activity log schema
const UserActivitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "upload",
        "prediction",
        "view_protein",
        "export",
        "settings_update",
        "profile_update",
      ],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// user demographics schema (for admin analytics)
const UserDemographicsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    country: {
      type: String,
      required: false,
    },
    countryCode: {
      type: String,
      required: false,
    },
    region: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    institution: {
      type: String,
      required: false,
    },
    researchField: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const UploadEvent = models?.UploadEvent || model("UploadEvent", UploadEventSchema);
export const BindingPrediction = models?.BindingPrediction || model("BindingPrediction", BindingPredictionSchema);
export const UserActivity = models?.UserActivity || model("UserActivity", UserActivitySchema);
export const UserDemographics = models?.UserDemographics || model("UserDemographics", UserDemographicsSchema);
