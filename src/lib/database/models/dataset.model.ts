import { Schema, model, models, Document, Types } from "mongoose";

// file type enum
export const DatasetFileType = {
  PDB: "pdb",
  FASTA: "fasta",
  CSV: "csv",
  FA: "fa",
} as const;

export type DatasetFileTypeType = typeof DatasetFileType[keyof typeof DatasetFileType];

// validation status enum
export const ValidationStatus = {
  PENDING: "pending",
  VALIDATING: "validating",
  VALID: "valid",
  INVALID: "invalid",
} as const;

export type ValidationStatusType = typeof ValidationStatus[keyof typeof ValidationStatus];

// validation log interface
export interface IValidationLog {
  timestamp: Date;
  level: "info" | "warning" | "error";
  message: string;
  field?: string;
}

// dataset document interface
export interface IDataset extends Document {
  filename: string;
  originalName: string;
  fileType: DatasetFileTypeType;
  fileSize: number;
  filePath: string;
  checksum: string;
  validationStatus: ValidationStatusType;
  validationLogs: IValidationLog[];
  uploadedBy: Types.ObjectId;
  experimentId?: Types.ObjectId;
  predictionId?: Types.ObjectId;
  metadata: {
    proteinCount?: number;
    residueCount?: number;
    chainCount?: number;
    sequenceLength?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// validation log sub-schema
const ValidationLogSchema = new Schema<IValidationLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    level: {
      type: String,
      enum: ["info", "warning", "error"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      lowercase: true,
    },
    field: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

// metadata sub-schema
const MetadataSchema = new Schema(
  {
    proteinCount: {
      type: Number,
      required: false,
    },
    residueCount: {
      type: Number,
      required: false,
    },
    chainCount: {
      type: Number,
      required: false,
    },
    sequenceLength: {
      type: Number,
      required: false,
    },
  },
  { _id: false }
);

// dataset schema
const DatasetSchema = new Schema<IDataset>(
  {
    filename: {
      type: String,
      required: [true, "filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "original name is required"],
      trim: true,
    },
    fileType: {
      type: String,
      enum: Object.values(DatasetFileType),
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    checksum: {
      type: String,
      required: true,
    },
    validationStatus: {
      type: String,
      enum: Object.values(ValidationStatus),
      default: ValidationStatus.PENDING,
    },
    validationLogs: {
      type: [ValidationLogSchema],
      default: [],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: "Experiment",
      required: false,
    },
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      required: false,
    },
    metadata: {
      type: MetadataSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// indexes
DatasetSchema.index({ uploadedBy: 1, createdAt: -1 });
DatasetSchema.index({ validationStatus: 1 });
DatasetSchema.index({ experimentId: 1 });
DatasetSchema.index({ checksum: 1 });

// export model
export const Dataset = models?.Dataset || model<IDataset>("Dataset", DatasetSchema);
