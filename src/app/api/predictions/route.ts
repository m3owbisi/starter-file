import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Prediction } from "@/lib/database/models/prediction.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// get all predictions for current user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const datasetId = searchParams.get("datasetId");

    const skip = (page - 1) * limit;

    // build query
    const query: Record<string, any> = {};
    if (userId) {
      query.userId = userId;
    }
    if (status) {
      query.status = status;
    }
    if (datasetId && mongoose.Types.ObjectId.isValid(datasetId)) {
      query.datasetId = datasetId;
    }

    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("datasetId", "filename originalName fileType")
        .lean(),
      Prediction.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("error fetching predictions:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch predictions" },
      { status: 500 }
    );
  }
}
