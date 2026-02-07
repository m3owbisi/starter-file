import { Schema, model, models, Document, Types } from "mongoose";

// experiment status enum
export const ExperimentStatus = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  COMPLETED: "completed",
} as const;

export type ExperimentStatusType = typeof ExperimentStatus[keyof typeof ExperimentStatus];

// run status enum
export const RunStatus = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type RunStatusType = typeof RunStatus[keyof typeof RunStatus];

// experiment document interface
export interface IExperiment extends Document {
  name: string;
  description: string;
  userId: Types.ObjectId;
  status: ExperimentStatusType;
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
}

// experiment run document interface
export interface IExperimentRun extends Document {
  experimentId: Types.ObjectId;
  userId: Types.ObjectId;
  runNumber: number;
  name: string;
  status: RunStatusType;
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  versionInfo: {
    version: string;
    parentRunId?: Types.ObjectId;
    branchName: string;
    commitMessage: string;
    isLatest: boolean;
  };
  tags: string[];
  datasetId?: Types.ObjectId;
  predictionId?: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

// experiment branch document interface
export interface IExperimentBranch extends Document {
  experimentId: Types.ObjectId;
  name: string;
  parentBranch?: string;
  createdFromRunId?: Types.ObjectId;
  userId: Types.ObjectId;
  description: string;
  createdAt: Date;
}

// experiment schema
const ExperimentSchema = new Schema<IExperiment>(
  {
    name: {
      type: String,
      required: [true, "experiment name is required"],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ExperimentStatus),
      default: ExperimentStatus.ACTIVE,
    },
    defaultBranch: {
      type: String,
      default: "main",
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// version info sub-schema
const VersionInfoSchema = new Schema(
  {
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    parentRunId: {
      type: Schema.Types.ObjectId,
      ref: "ExperimentRun",
      required: false,
    },
    branchName: {
      type: String,
      required: true,
      default: "main",
      lowercase: true,
    },
    commitMessage: {
      type: String,
      default: "",
    },
    isLatest: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

// experiment run schema
const ExperimentRunSchema = new Schema<IExperimentRun>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    runNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: Object.values(RunStatus),
      default: RunStatus.RUNNING,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    versionInfo: {
      type: VersionInfoSchema,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    datasetId: {
      type: Schema.Types.ObjectId,
      ref: "Dataset",
      required: false,
    },
    predictionId: {
      type: Schema.Types.ObjectId,
      ref: "Prediction",
      required: false,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: false,
    },
    duration: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// experiment branch schema
const ExperimentBranchSchema = new Schema<IExperimentBranch>(
  {
    experimentId: {
      type: Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
    name: {
      type: String,
      required: [true, "branch name is required"],
      trim: true,
      lowercase: true,
    },
    parentBranch: {
      type: String,
      required: false,
      lowercase: true,
    },
    createdFromRunId: {
      type: Schema.Types.ObjectId,
      ref: "ExperimentRun",
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// indexes for experiment runs
ExperimentRunSchema.index({ experimentId: 1, "versionInfo.branchName": 1, runNumber: -1 });
ExperimentRunSchema.index({ experimentId: 1, "versionInfo.version": 1 });
ExperimentRunSchema.index({ tags: 1 });
ExperimentRunSchema.index({ status: 1 });
ExperimentRunSchema.index({ experimentId: 1, "versionInfo.isLatest": 1 });

// indexes for experiment branches
ExperimentBranchSchema.index({ experimentId: 1, name: 1 }, { unique: true });

// indexes for experiments
ExperimentSchema.index({ userId: 1, status: 1 });
ExperimentSchema.index({ name: 1, userId: 1 });

// export models
export const Experiment = models?.Experiment || model<IExperiment>("Experiment", ExperimentSchema);
export const ExperimentRun = models?.ExperimentRun || model<IExperimentRun>("ExperimentRun", ExperimentRunSchema);
export const ExperimentBranch = models?.ExperimentBranch || model<IExperimentBranch>("ExperimentBranch", ExperimentBranchSchema);
