import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 1. Get the data sent from the frontend
  const body = await request.json();

  // 2. Define your API Key and Endpoint (Securely on the server)
  // ideally use process.env.NVIDIA_API_KEY
  const API_KEY = "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"; 
  const invokeUrl = "https://health.api.nvidia.com/v1/biology/nvidia/molmim/generate";

  try {
    // 3. Forward the request to NVIDIA
    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 4. Return the result back to your frontend
    // We forward the status code and the data
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error("Server Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch from NVIDIA" }, { status: 500 });
  }
}