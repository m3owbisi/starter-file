import { NextRequest, NextResponse } from "next/server";

// fastapi backend url
const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// timeout for prediction requests (30 seconds)
const PREDICTION_TIMEOUT = 30000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PREDICTION_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          data,
          { status: response.status }
        );
      }

      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      const error = fetchError as Error & { cause?: { code?: string } };
      clearTimeout(timeoutId);

      // handle abort/timeout
      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error: "request timed out. please try again.",
            code: "timeout",
          },
          { status: 408 }
        );
      }

      // handle connection refused (backend not running)
      if (error.cause?.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            success: false,
            error: "prediction service unavailable. please ensure the backend is running.",
            code: "service_unavailable",
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
