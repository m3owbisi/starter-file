import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────
// POST /api/predict/[datasetId]
//
// accepts: { amino_acid_sequence, model_version, parameters }
// logic:   dataset pdb content comes from client (via context), so
//          this route proxies to the FastAPI backend with the full
//          payload including pdb_data sent from the client.
//
// why:     the datasetId scopes the prediction for history/analytics.
//          in production you'd fetch the PDB from server-side storage
//          using the datasetId, but for this architecture we receive
//          the pdb content and dataset metadata from the client context.
// ─────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const PREDICTION_TIMEOUT = 30000;

export async function POST(
  request: NextRequest,
  { params }: { params: { datasetId: string } }
) {
  const { datasetId } = params;

  if (!datasetId) {
    return NextResponse.json(
      {
        success: false,
        error: "dataset id is required",
        code: "missing_dataset_id",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // validate that we have the minimum required data
    if (!body.amino_acid_sequence || body.amino_acid_sequence.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "amino acid sequence must be at least 10 characters",
          code: "invalid_input",
        },
        { status: 400 }
      );
    }

    // build the prediction request for the ml backend
    const predictionRequest: Record<string, unknown> = {
      amino_acid_sequence: body.amino_acid_sequence.trim().toUpperCase(),
      dataset_id: datasetId,
      model_version: body.model_version || "proteinbind-v1.0",
      parameters: body.parameters || {},
    };

    // include pdb data if provided from the dataset context
    if (body.pdb_data) {
      predictionRequest.pdb_data = body.pdb_data;
    }

    // include chemical properties if provided
    if (body.chemical_properties) {
      predictionRequest.chemical_properties = body.chemical_properties;
    }

    // create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PREDICTION_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(predictionRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || "prediction failed",
            code: data.code || "backend_error",
            datasetId,
          },
          { status: response.status }
        );
      }

      // attach dataset context to the response
      return NextResponse.json({
        ...data,
        datasetId,
        modelVersion: body.model_version || "proteinbind-v1.0",
        parametersUsed: body.parameters || {},
      });
    } catch (fetchError: unknown) {
      const error = fetchError as Error & { cause?: { code?: string } };
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error: "prediction request timed out. please try again.",
            code: "timeout",
            datasetId,
          },
          { status: 408 }
        );
      }

      if (error.cause?.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            success: false,
            error:
              "prediction service unavailable. please ensure the ml backend is running.",
            code: "service_unavailable",
            datasetId,
          },
          { status: 503 }
        );
      }

      throw error;
    }
  } catch (error: unknown) {
    console.error("prediction api error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "prediction failed. please try again.",
        code: "error",
        datasetId,
      },
      { status: 500 }
    );
  }
}

// handle options for cors
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
