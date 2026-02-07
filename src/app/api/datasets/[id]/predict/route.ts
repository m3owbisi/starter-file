import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { Dataset } from "@/lib/database/models/dataset.model";
import { Prediction, PredictionStatus } from "@/lib/database/models/prediction.model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// trigger prediction for a dataset
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid dataset id" },
        { status: 400 }
      );
    }

    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: "dataset not found" },
        { status: 404 }
      );
    }

    // check if dataset is validated
    if (dataset.validationStatus !== "valid") {
      return NextResponse.json(
        { success: false, error: "dataset must be validated before prediction" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { sequence, ligandSmiles, modelVersion = "1.0.0" } = body;

    // create prediction record
    const prediction = await Prediction.create({
      datasetId: dataset._id,
      experimentId: dataset.experimentId,
      userId,
      modelVersion,
      modelName: "proteinbind-transformer-v1",
      inputData: {
        sequence,
        ligandSmiles,
        structureType: dataset.fileType,
      },
      bindingSites: [],
      overallScore: 0,
      confidenceScore: 0,
      inferenceTime: 0,
      status: PredictionStatus.QUEUED,
    });

    // link prediction to dataset
    await Dataset.findByIdAndUpdate(dataset._id, {
      predictionId: prediction._id,
    });

    // simulate async prediction (in production, this would be a queue job)
    simulatePrediction(prediction._id.toString());

    return NextResponse.json({
      success: true,
      predictionId: prediction._id,
      userId,
      message: "prediction queued successfully",
    });
  } catch (error) {
    console.error("error triggering prediction:", error);
    return NextResponse.json(
      { success: false, error: "failed to trigger prediction" },
      { status: 500 }
    );
  }
}

// simulate async prediction (mock for development)
async function simulatePrediction(predictionId: string): Promise<void> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await connectToDatabase();

    // update to running
    await Prediction.findByIdAndUpdate(predictionId, {
      status: PredictionStatus.RUNNING,
    });

    // simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // generate mock binding sites
    const bindingSites = [];
    const numSites = Math.floor(Math.random() * 8) + 3;

    for (let i = 0; i < numSites; i++) {
      bindingSites.push({
        residueId: `res_${i + 1}`,
        chainId: ["A", "B", "C"][Math.floor(Math.random() * 3)],
        residueName: ["ALA", "GLY", "LEU", "VAL", "SER", "THR", "ASP", "GLU"][
          Math.floor(Math.random() * 8)
        ],
        position: Math.floor(Math.random() * 200) + 1,
        bindingScore: Math.random() * 0.5 + 0.5,
        confidence: Math.random() * 0.3 + 0.7,
        coordinates: {
          x: (Math.random() - 0.5) * 50,
          y: (Math.random() - 0.5) * 50,
          z: (Math.random() - 0.5) * 50,
        },
      });
    }

    const overallScore = bindingSites.reduce((sum, s) => sum + s.bindingScore, 0) / numSites;
    const confidenceScore = bindingSites.reduce((sum, s) => sum + s.confidence, 0) / numSites;

    // update with results
    await Prediction.findByIdAndUpdate(predictionId, {
      status: PredictionStatus.COMPLETED,
      bindingSites,
      overallScore,
      confidenceScore,
      uncertaintyEstimate: 1 - confidenceScore,
      inferenceTime: Math.random() * 2000 + 500,
    });
  } catch (error) {
    console.error("prediction simulation error:", error);
    await Prediction.findByIdAndUpdate(predictionId, {
      status: PredictionStatus.FAILED,
      errorMessage: "prediction processing failed",
    });
  }
}
