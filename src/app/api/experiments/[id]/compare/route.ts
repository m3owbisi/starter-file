import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import { ExperimentRun } from "@/lib/database/models/experiment.model";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// compare multiple runs
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    const body = await request.json();
    const { runIds } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "invalid experiment id" },
        { status: 400 }
      );
    }

    if (!runIds || !Array.isArray(runIds) || runIds.length < 2) {
      return NextResponse.json(
        { success: false, error: "at least two run ids are required for comparison" },
        { status: 400 }
      );
    }

    // validate all run ids
    const validRunIds = runIds.filter((rid) => mongoose.Types.ObjectId.isValid(rid));
    if (validRunIds.length !== runIds.length) {
      return NextResponse.json(
        { success: false, error: "one or more invalid run ids" },
        { status: 400 }
      );
    }

    // fetch all runs
    const runs = await ExperimentRun.find({
      _id: { $in: validRunIds },
      experimentId: id,
    }).lean();

    if (runs.length !== validRunIds.length) {
      return NextResponse.json(
        { success: false, error: "one or more runs not found" },
        { status: 404 }
      );
    }

    // collect all unique parameter and metric keys
    const parameterKeys = new Set<string>();
    const metricKeys = new Set<string>();

    runs.forEach((run) => {
      Object.keys(run.parameters || {}).forEach((key) => parameterKeys.add(key));
      Object.keys(run.metrics || {}).forEach((key) => metricKeys.add(key));
    });

    // build comparison data
    const comparison = {
      runs: runs.map((run) => ({
        _id: run._id,
        runNumber: run.runNumber,
        name: run.name,
        status: run.status,
        version: run.versionInfo?.version,
        branchName: run.versionInfo?.branchName,
        startTime: run.startTime,
        endTime: run.endTime,
        duration: run.duration,
        tags: run.tags,
      })),
      parameters: {
        keys: Array.from(parameterKeys),
        values: runs.map((run) => {
          const values: Record<string, any> = {};
          parameterKeys.forEach((key) => {
            values[key] = run.parameters?.[key] ?? null;
          });
          return { runId: run._id, runNumber: run.runNumber, values };
        }),
      },
      metrics: {
        keys: Array.from(metricKeys),
        values: runs.map((run) => {
          const values: Record<string, any> = {};
          metricKeys.forEach((key) => {
            values[key] = run.metrics?.[key] ?? null;
          });
          return { runId: run._id, runNumber: run.runNumber, values };
        }),
      },
      // calculate metric statistics
      statistics: calculateMetricStats(runs, Array.from(metricKeys)),
    };

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("error comparing runs:", error);
    return NextResponse.json(
      { success: false, error: "failed to compare runs" },
      { status: 500 }
    );
  }
}

// helper function to calculate metric statistics
function calculateMetricStats(runs: any[], metricKeys: string[]) {
  const stats: Record<string, { min: number; max: number; avg: number; bestRunId: string }> = {};

  metricKeys.forEach((key) => {
    const values = runs
      .map((run) => ({ runId: run._id, value: run.metrics?.[key] }))
      .filter((v) => typeof v.value === "number");

    if (values.length > 0) {
      const numericValues = values.map((v) => v.value);
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      
      // determine best - for accuracy/scores higher is better, for loss lower is better
      const isLowerBetter = key.toLowerCase().includes("loss") || key.toLowerCase().includes("error");
      const bestValue = isLowerBetter ? min : max;
      const bestRun = values.find((v) => v.value === bestValue);

      stats[key] = {
        min,
        max,
        avg: parseFloat(avg.toFixed(4)),
        bestRunId: bestRun?.runId?.toString() || "",
      };
    }
  });

  return stats;
}
