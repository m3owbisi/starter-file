import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Experiment, ExperimentBranch } from "@/lib/database/models/experiment.model";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

// mock user id for development
const MOCK_USER_ID = "507f1f77bcf86cd799439011";

// get all experiments
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // build query
    const query: Record<string, any> = {};
    if (status) {
      query.status = status;
    }

    // get session for user filtering (optional)
    const session = await getServerSession();
    if (session?.user) {
      // in production, filter by user id
      // query.userId = session.user.id;
    }

    const [experiments, total] = await Promise.all([
      Experiment.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Experiment.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        experiments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("error fetching experiments:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch experiments" },
      { status: 500 }
    );
  }
}

// create new experiment
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "experiment name is required" },
        { status: 400 }
      );
    }

    // get session for user id
    const session = await getServerSession();
    const userId = (session?.user as any)?.id || MOCK_USER_ID;

    // create experiment
    const experiment = await Experiment.create({
      name: name.toLowerCase().trim(),
      description: description?.toLowerCase() || "",
      userId,
      status: "active",
      defaultBranch: "main",
    });

    // create default main branch
    await ExperimentBranch.create({
      experimentId: experiment._id,
      name: "main",
      userId,
      description: "default main branch",
    });

    return NextResponse.json({
      success: true,
      data: experiment,
    });
  } catch (error: any) {
    console.error("error creating experiment:", error);
    
    // handle duplicate name error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "experiment with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "failed to create experiment" },
      { status: 500 }
    );
  }
}
