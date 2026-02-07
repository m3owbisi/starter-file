import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentRun } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string; runId: string }>;
}

// get tags for a run
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
    }).select("tags").lean();

    if (!run) {
      return NextResponse.json(
        { success: false, error: "run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run.tags || [],
    });
  } catch (error) {
    console.error("error fetching tags:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch tags" },
      { status: 500 }
    );
  }
}

// add tags to a run
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

    const { tags } = body;

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: "tags array is required" },
        { status: 400 }
      );
    }

    // add tags (avoiding duplicates)
    const run = await ExperimentRun.findOneAndUpdate(
      { _id: runId, experimentId: id },
      { $addToSet: { tags: { $each: tags.map((t: string) => t.toLowerCase().trim()) } } },
      { new: true }
    ).select("tags").lean();

    if (!run) {
      return NextResponse.json(
        { success: false, error: "run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run.tags,
    });
  } catch (error) {
    console.error("error adding tags:", error);
    return NextResponse.json(
      { success: false, error: "failed to add tags" },
      { status: 500 }
    );
  }
}

// remove tags from a run
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id, runId } = await params;
    const { searchParams } = new URL(request.url);
    const tagsToRemove = searchParams.get("tags")?.split(",").filter(Boolean);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(runId)) {
      return NextResponse.json(
        { success: false, error: "invalid id" },
        { status: 400 }
      );
    }

    if (!tagsToRemove || tagsToRemove.length === 0) {
      return NextResponse.json(
        { success: false, error: "tags to remove are required" },
        { status: 400 }
      );
    }

    // remove specified tags
    const run = await ExperimentRun.findOneAndUpdate(
      { _id: runId, experimentId: id },
      { $pull: { tags: { $in: tagsToRemove.map((t) => t.toLowerCase().trim()) } } },
      { new: true }
    ).select("tags").lean();

    if (!run) {
      return NextResponse.json(
        { success: false, error: "run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: run.tags,
    });
  } catch (error) {
    console.error("error removing tags:", error);
    return NextResponse.json(
      { success: false, error: "failed to remove tags" },
      { status: 500 }
    );
  }
}
