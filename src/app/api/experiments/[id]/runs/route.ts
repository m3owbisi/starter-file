import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentRun, Experiment } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

// mock user id for development
const MOCK_USER_ID = "507f1f77bcf86cd799439011";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// get all runs for an experiment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // query parameters
    const branch = searchParams.get("branch");
    const status = searchParams.get("status");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    // build query
    const query: Record<string, any> = { experimentId: id };
    if (branch) {
      query["versionInfo.branchName"] = branch;
    }
    if (status) {
      query.status = status;
    }
    if (tags && tags.length > 0) {
      query.tags = { $all: tags };
    }

    const [runs, total] = await Promise.all([
      ExperimentRun.find(query)
        .sort({ runNumber: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExperimentRun.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        runs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("error fetching experiment runs:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch experiment runs" },
      { status: 500 }
    );
  }
}

// create new run
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    // check experiment exists
    const experiment = await Experiment.findById(id);
    if (!experiment) {
      return NextResponse.json(
        { success: false, error: "experiment not found" },
        { status: 404 }
      );
    }

    // get session for user id
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || MOCK_USER_ID;

    // get next run number
    const lastRun = await ExperimentRun.findOne({ experimentId: id })
      .sort({ runNumber: -1 })
      .select("runNumber versionInfo.version")
      .lean() as { runNumber?: number; versionInfo?: { version?: string } } | null;

    const runNumber = (lastRun?.runNumber || 0) + 1;
    
    // calculate next version
    let version = "1.0.0";
    if (lastRun?.versionInfo?.version) {
      const parts = lastRun.versionInfo.version.split(".");
      const patch = parseInt(parts[2] || "0") + 1;
      version = `${parts[0]}.${parts[1]}.${patch}`;
    }

    const {
      name,
      parameters = {},
      metrics = {},
      branchName = experiment.defaultBranch,
      commitMessage = "",
      tags = [],
      parentRunId,
    } = body;

    // mark previous runs as not latest on this branch
    await ExperimentRun.updateMany(
      { experimentId: id, "versionInfo.branchName": branchName, "versionInfo.isLatest": true },
      { $set: { "versionInfo.isLatest": false } }
    );

    // create the run
    const run = await ExperimentRun.create({
      experimentId: id,
      userId,
      runNumber,
      name: name?.toLowerCase() || `run ${runNumber}`,
      status: "running",
      parameters,
      metrics,
      versionInfo: {
        version,
        parentRunId: parentRunId || null,
        branchName: branchName.toLowerCase(),
        commitMessage: commitMessage.toLowerCase(),
        isLatest: true,
      },
      tags: tags.map((t: string) => t.toLowerCase()),
      startTime: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error("error creating experiment run:", error);
    return NextResponse.json(
      { success: false, error: "failed to create experiment run" },
      { status: 500 }
    );
  }
}
