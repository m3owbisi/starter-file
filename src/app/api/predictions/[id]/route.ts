import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Prediction } from "@/lib/database/models/prediction.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// get single prediction with binding sites
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid prediction id" },
        { status: 400 }
      );
    }

    const prediction = await Prediction.findById(id)
      .populate("datasetId", "filename originalName fileType metadata")
      .populate("experimentId", "name status")
      .lean();

    if (!prediction) {
      return NextResponse.json(
        { success: false, error: "prediction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("error fetching prediction:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch prediction" },
      { status: 500 }
    );
  }
}

// delete prediction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid prediction id" },
        { status: 400 }
      );
    }

    await Prediction.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "prediction deleted successfully",
    });
  } catch (error) {
    console.error("error deleting prediction:", error);
    return NextResponse.json(
      { success: false, error: "failed to delete prediction" },
      { status: 500 }
    );
  }
}
