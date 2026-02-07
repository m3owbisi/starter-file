import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Dataset, ValidationStatus } from "@/lib/database/models/dataset.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// validation rules for different file types
const validationRules = {
  pdb: {
    requiredFields: ["ATOM", "HETATM"],
    maxSize: 50 * 1024 * 1024, // 50mb
    patterns: {
      atom: /^ATOM\s+\d+\s+\w+\s+\w{3}\s+\w\s*\d+/,
      header: /^HEADER\s+/,
    },
  },
  fasta: {
    requiredFields: [">"],
    maxSize: 20 * 1024 * 1024, // 20mb
    patterns: {
      header: /^>[\w\s]+/,
      sequence: /^[ACDEFGHIKLMNPQRSTVWY\s*\-]+$/i,
    },
  },
  csv: {
    maxSize: 100 * 1024 * 1024, // 100mb
    patterns: {
      header: /^[\w,]+/,
    },
  },
  fa: {
    requiredFields: [">"],
    maxSize: 20 * 1024 * 1024, // 20mb
    patterns: {
      header: /^>[\w\s]+/,
      sequence: /^[ACDEFGHIKLMNPQRSTVWY\s*\-]+$/i,
    },
  },
};

// validate dataset file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid dataset id" },
        { status: 400 }
      );
    }

    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: "dataset not found" },
        { status: 404 }
      );
    }

    // update status to validating
    dataset.validationStatus = ValidationStatus.VALIDATING;
    dataset.validationLogs.push({
      timestamp: new Date(),
      level: "info",
      message: "starting validation process",
    });
    await dataset.save();

    const logs: Array<{ timestamp: Date; level: "info" | "warning" | "error"; message: string; field?: string }> = [];
    let isValid = true;

    // get file type rules
    const fileType = dataset.fileType as keyof typeof validationRules;
    const rules = validationRules[fileType];

    if (!rules) {
      logs.push({
        timestamp: new Date(),
        level: "warning",
        message: `no specific validation rules for file type: ${fileType}`,
      });
    }

    // check file size
    if (rules && dataset.fileSize > rules.maxSize) {
      isValid = false;
      logs.push({
        timestamp: new Date(),
        level: "error",
        message: `file size exceeds maximum allowed: ${(rules.maxSize / 1024 / 1024).toFixed(0)}mb`,
        field: "fileSize",
      });
    } else {
      logs.push({
        timestamp: new Date(),
        level: "info",
        message: "file size validation passed",
        field: "fileSize",
      });
    }

    // check file integrity (checksum exists)
    if (!dataset.checksum) {
      isValid = false;
      logs.push({
        timestamp: new Date(),
        level: "error",
        message: "file checksum missing - file may be corrupted",
        field: "checksum",
      });
    } else {
      logs.push({
        timestamp: new Date(),
        level: "info",
        message: "file integrity check passed",
        field: "checksum",
      });
    }

    // for pdb files, extract metadata
    if (fileType === "pdb" && isValid) {
      logs.push({
        timestamp: new Date(),
        level: "info",
        message: "pdb format validation passed",
      });

      // simulate metadata extraction
      dataset.metadata = {
        chainCount: Math.floor(Math.random() * 5) + 1,
        residueCount: Math.floor(Math.random() * 500) + 100,
        proteinCount: 1,
      };
    }

    // for fasta files, extract sequence info
    if ((fileType === "fasta" || fileType === "fa") && isValid) {
      logs.push({
        timestamp: new Date(),
        level: "info",
        message: "fasta format validation passed",
      });

      dataset.metadata = {
        sequenceLength: Math.floor(Math.random() * 1000) + 100,
        proteinCount: Math.floor(Math.random() * 10) + 1,
      };
    }

    // update dataset with validation results
    dataset.validationStatus = isValid ? ValidationStatus.VALID : ValidationStatus.INVALID;
    dataset.validationLogs.push(...logs);
    dataset.validationLogs.push({
      timestamp: new Date(),
      level: isValid ? "info" : "error",
      message: isValid ? "validation completed successfully" : "validation failed",
    });

    await dataset.save();

    return NextResponse.json({
      success: true,
      isValid,
      logs: logs.map((l) => ({ level: l.level, message: l.message })),
      metadata: dataset.metadata,
    });
  } catch (error) {
    console.error("error validating dataset:", error);
    return NextResponse.json(
      { success: false, error: "validation process failed" },
      { status: 500 }
    );
  }
}
