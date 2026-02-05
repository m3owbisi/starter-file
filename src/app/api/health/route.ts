import { NextResponse } from "next/server";

// fastapi backend url
const BACKEND_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "backend service returned error",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error & { cause?: { code?: string } };
    // handle connection refused (backend not running)
    if (error.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          status: "unavailable",
          message: "backend service is not running",
        },
        { status: 503 }
      );
    }

    console.error("health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "health check failed",
      },
      { status: 500 }
    );
  }
}
