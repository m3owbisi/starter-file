import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Dataset, ValidationStatus } from "@/lib/database/models/dataset.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// get single dataset
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid dataset id" },
        { status: 400 }
      );
    }

    const dataset = await Dataset.findById(id)
      .populate("experimentId")
      .populate("predictionId")
      .lean();

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: "dataset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error("error fetching dataset:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch dataset" },
      { status: 500 }
    );
  }
}

// update dataset
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid dataset id" },
        { status: 400 }
      );
    }

    const { validationStatus, metadata, experimentId } = body;

    const updateData: Record<string, any> = {};
    if (validationStatus) updateData.validationStatus = validationStatus;
    if (metadata) updateData.metadata = metadata;
    if (experimentId) updateData.experimentId = experimentId;

    const dataset = await Dataset.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: "dataset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dataset,
    });
  } catch (error) {
    console.error("error updating dataset:", error);
    return NextResponse.json(
      { success: false, error: "failed to update dataset" },
      { status: 500 }
    );
  }
}

// delete dataset
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid dataset id" },
        { status: 400 }
      );
    }

    await Dataset.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "dataset deleted successfully",
    });
  } catch (error) {
    console.error("error deleting dataset:", error);
    return NextResponse.json(
      { success: false, error: "failed to delete dataset" },
      { status: 500 }
    );
  }
}
