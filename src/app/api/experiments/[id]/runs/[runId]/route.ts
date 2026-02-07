import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentRun } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string; runId: string }>;
}

// get single run
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id, runId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(runId)) {
      return NextResponse.json(
        { success: false, error: "invalid id" },
        { status: 400 }
      );
    }

    const run = await ExperimentRun.findOne({
      _id: runId,
      experimentId: id,
    }).lean();

    if (!run) {
      return NextResponse.json(
        { success: false, error: "run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error("error fetching run:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch run" },
      { status: 500 }
    );
  }
}

// update run
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { name, status, parameters, metrics, tags, commitMessage } = body;

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.toLowerCase();
    if (status) {
      updateData.status = status;
      // if completing, set end time and duration
      if (status === "completed" || status === "failed" || status === "cancelled") {
        updateData.endTime = new Date();
      }
    }
    if (parameters) updateData.parameters = parameters;
    if (metrics) updateData.metrics = metrics;
    if (tags) updateData.tags = tags.map((t: string) => t.toLowerCase());
    if (commitMessage) updateData["versionInfo.commitMessage"] = commitMessage.toLowerCase();

    const run = await ExperimentRun.findOneAndUpdate(
      { _id: runId, experimentId: id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean() as any;

    if (!run) {
      return NextResponse.json(
        { success: false, error: "run not found" },
        { status: 404 }
      );
    }

    // calculate duration if we have both start and end times
    if (run.startTime && run.endTime) {
      const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
      await ExperimentRun.findByIdAndUpdate(runId, { duration });
      run.duration = duration;
    }

    return NextResponse.json({
      success: true,
      data: run,
    });
  } catch (error) {
    console.error("error updating run:", error);
    return NextResponse.json(
      { success: false, error: "failed to update run" },
      { status: 500 }
    );
  }
}

// delete run
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id, runId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(runId)) {
      return NextResponse.json(
        { success: false, error: "invalid id" },
        { status: 400 }
      );
    }

    await ExperimentRun.findOneAndDelete({ _id: runId, experimentId: id });

    return NextResponse.json({
      success: true,
      message: "run deleted successfully",
    });
  } catch (error) {
    console.error("error deleting run:", error);
    return NextResponse.json(
      { success: false, error: "failed to delete run" },
      { status: 500 }
    );
  }
}
