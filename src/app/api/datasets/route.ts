import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Dataset, ValidationStatus } from "@/lib/database/models/dataset.model";
import { Experiment } from "@/lib/database/models/experiment.model";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// get all datasets for current user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const fileType = searchParams.get("fileType");

    const skip = (page - 1) * limit;

    // build query
    const query: Record<string, any> = {};
    if (userId) {
      query.uploadedBy = userId;
    }
    if (status) {
      query.validationStatus = status;
    }
    if (fileType) {
      query.fileType = fileType;
    }

    const [datasets, total] = await Promise.all([
      Dataset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Dataset.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        datasets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("error fetching datasets:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch datasets" },
      { status: 500 }
    );
  }
}

// create a new dataset record
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      filename,
      originalName,
      fileType,
      fileSize,
      filePath,
      fileContent,
      autoCreateExperiment,
      experimentName,
    } = body;

    // generate checksum
    const checksum = fileContent
      ? crypto.createHash("md5").update(fileContent).digest("hex")
      : crypto.randomBytes(16).toString("hex");

    // create dataset record
    const dataset = await Dataset.create({
      filename,
      originalName,
      fileType: fileType.toLowerCase().replace(".", ""),
      fileSize,
      filePath,
      checksum,
      validationStatus: ValidationStatus.PENDING,
      uploadedBy: userId,
      validationLogs: [
        {
          timestamp: new Date(),
          level: "info",
          message: "dataset uploaded successfully",
        },
      ],
    });

    // optionally create experiment linked to dataset
    let experiment = null;
    if (autoCreateExperiment) {
      experiment = await Experiment.create({
        name: (experimentName || `experiment-${Date.now()}`).toLowerCase(),
        description: `auto-created from dataset upload: ${originalName}`,
        userId,
        status: "active",
        defaultBranch: "main",
      });

      // link experiment to dataset
      await Dataset.findByIdAndUpdate(dataset._id, {
        experimentId: experiment._id,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        dataset,
        experiment,
      },
    });
  } catch (error) {
    console.error("error creating dataset:", error);
    return NextResponse.json(
      { success: false, error: "failed to create dataset" },
      { status: 500 }
    );
  }
}
