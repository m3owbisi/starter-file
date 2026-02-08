import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentBranch, ExperimentRun, Experiment } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

// mock user id for development
const MOCK_USER_ID = "507f1f77bcf86cd799439011";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// get all branches for an experiment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    const branches = await ExperimentBranch.find({ experimentId: id })
      .sort({ createdAt: 1 })
      .lean();

    // get run counts for each branch
    const branchesWithCounts = await Promise.all(
      branches.map(async (branch) => {
        const runCount = await ExperimentRun.countDocuments({
          experimentId: id,
          "versionInfo.branchName": branch.name,
        });
        return { ...branch, runCount };
      })
    );

    return NextResponse.json({
      success: true,
      data: branchesWithCounts,
    });
  } catch (error) {
    console.error("error fetching branches:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch branches" },
      { status: 500 }
    );
  }
}

// create new branch
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

    const { name, parentBranch, createdFromRunId, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "branch name is required" },
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

    // check if branch already exists
    const existingBranch = await ExperimentBranch.findOne({
      experimentId: id,
      name: name.toLowerCase().trim(),
    });

    if (existingBranch) {
      return NextResponse.json(
        { success: false, error: "branch with this name already exists" },
        { status: 400 }
      );
    }

    // get session for user id
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || MOCK_USER_ID;

    // create branch
    const branch = await ExperimentBranch.create({
      experimentId: id,
      name: name.toLowerCase().trim(),
      parentBranch: parentBranch?.toLowerCase() || experiment.defaultBranch,
      createdFromRunId: createdFromRunId || null,
      userId,
      description: description?.toLowerCase() || "",
    });

    return NextResponse.json({
      success: true,
      data: branch,
    });
  } catch (error: any) {
    console.error("error creating branch:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "branch with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "failed to create branch" },
      { status: 500 }
    );
  }
}

// delete branch
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const branchName = searchParams.get("name");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    if (!branchName) {
      return NextResponse.json(
        { success: false, error: "branch name is required" },
        { status: 400 }
      );
    }

    // prevent deleting main branch
    if (branchName.toLowerCase() === "main") {
      return NextResponse.json(
        { success: false, error: "cannot delete main branch" },
        { status: 400 }
      );
    }

    // delete branch
    await ExperimentBranch.findOneAndDelete({
      experimentId: id,
      name: branchName.toLowerCase(),
    });

    return NextResponse.json({
      success: true,
      message: "branch deleted successfully",
    });
  } catch (error) {
    console.error("error deleting branch:", error);
    return NextResponse.json(
      { success: false, error: "failed to delete branch" },
      { status: 500 }
    );
  }
}
