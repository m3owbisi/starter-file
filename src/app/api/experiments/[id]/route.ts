import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Experiment, ExperimentRun, ExperimentBranch } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// get single experiment
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

    const experiment = await Experiment.findById(id).lean();

    if (!experiment) {
      return NextResponse.json(
        { success: false, error: "experiment not found" },
        { status: 404 }
      );
    }

    // get run count and branches
    const [runCount, branches] = await Promise.all([
      ExperimentRun.countDocuments({ experimentId: id }),
      ExperimentBranch.find({ experimentId: id }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...experiment,
        runCount,
        branches,
      },
    });
  } catch (error) {
    console.error("error fetching experiment:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch experiment" },
      { status: 500 }
    );
  }
}

// update experiment
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { name, description, status } = body;

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name.toLowerCase().trim();
    if (description !== undefined) updateData.description = description.toLowerCase();
    if (status) updateData.status = status;

    const experiment = await Experiment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!experiment) {
      return NextResponse.json(
        { success: false, error: "experiment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: experiment,
    });
  } catch (error) {
    console.error("error updating experiment:", error);
    return NextResponse.json(
      { success: false, error: "failed to update experiment" },
      { status: 500 }
    );
  }
}

// delete experiment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    // delete experiment and all related data
    await Promise.all([
      Experiment.findByIdAndDelete(id),
      ExperimentRun.deleteMany({ experimentId: id }),
      ExperimentBranch.deleteMany({ experimentId: id }),
    ]);

    return NextResponse.json({
      success: true,
      message: "experiment deleted successfully",
    });
  } catch (error) {
    console.error("error deleting experiment:", error);
    return NextResponse.json(
      { success: false, error: "failed to delete experiment" },
      { status: 500 }
    );
  }
}
