import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentRun, Experiment } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

// mock user id for development
const MOCK_USER_ID = "507f1f77bcf86cd799439011";

interface RouteParams {
  params: Promise<{ id: string; runId: string }>;
}

// rollback to a specific run - creates a new run based on the specified run
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id, runId } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(runId)) {
      return NextResponse.json(
        { success: false, error: "invalid id" },
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

    // get the run to rollback to
    const sourceRun = await ExperimentRun.findOne({
      _id: runId,
      experimentId: id,
    }).lean();

    if (!sourceRun) {
      return NextResponse.json(
        { success: false, error: "run not found" },
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
      .lean();

    const runNumber = (lastRun?.runNumber || 0) + 1;

    // calculate next version
    let version = "1.0.0";
    if (lastRun?.versionInfo?.version) {
      const parts = lastRun.versionInfo.version.split(".");
      const patch = parseInt(parts[2] || "0") + 1;
      version = `${parts[0]}.${parts[1]}.${patch}`;
    }

    const branchName = body.branchName?.toLowerCase() || sourceRun.versionInfo?.branchName || experiment.defaultBranch;
    const commitMessage = body.commitMessage?.toLowerCase() || `rollback to run ${sourceRun.runNumber}`;

    // mark previous runs as not latest on this branch
    await ExperimentRun.updateMany(
      { experimentId: id, "versionInfo.branchName": branchName, "versionInfo.isLatest": true },
      { $set: { "versionInfo.isLatest": false } }
    );

    // create new run based on source run
    const newRun = await ExperimentRun.create({
      experimentId: id,
      userId,
      runNumber,
      name: `rollback to run ${sourceRun.runNumber}`,
      status: "running",
      parameters: sourceRun.parameters,
      metrics: {}, // start with empty metrics for new run
      versionInfo: {
        version,
        parentRunId: runId, // reference to the source run
        branchName,
        commitMessage,
        isLatest: true,
      },
      tags: [...(sourceRun.tags || []), "rollback"],
      startTime: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: newRun,
      message: `created new run ${runNumber} based on run ${sourceRun.runNumber}`,
    });
  } catch (error) {
    console.error("error performing rollback:", error);
    return NextResponse.json(
      { success: false, error: "failed to perform rollback" },
      { status: 500 }
    );
  }
}
