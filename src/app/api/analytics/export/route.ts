import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// generate csv content from data
const generateCSV = (data: any[], headers: string[]) => {
  const headerRow = headers.join(",");
  const dataRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // escape commas and quotes in values
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
};

// mock data generators
const generateUploadExportData = (dateRange: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = dateRange - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_uploads: Math.floor(Math.random() * 50) + 10,
      successful: Math.floor(Math.random() * 45) + 8,
      failed: Math.floor(Math.random() * 5),
    });
  }
  return data;
};

const generatePredictionExportData = (dateRange: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = dateRange - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const total = Math.floor(Math.random() * 100) + 20;
    const successRate = 75 + Math.random() * 20;
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_predictions: total,
      successful: Math.floor(total * successRate / 100),
      success_rate: successRate.toFixed(1) + "%",
    });
  }
  return data;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const metrics = searchParams.get("metrics") || "uploads";
    const dateRange = parseInt(searchParams.get("dateRange") || "30");
    
    let data: any[];
    let headers: string[];
    let filename: string;
    
    switch (metrics) {
      case "uploads":
        data = generateUploadExportData(dateRange);
        headers = ["date", "total_uploads", "successful", "failed"];
        filename = `upload_analytics_${new Date().toISOString().split('T')[0]}`;
        break;
      case "predictions":
        data = generatePredictionExportData(dateRange);
        headers = ["date", "total_predictions", "successful", "success_rate"];
        filename = `prediction_analytics_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        data = generateUploadExportData(dateRange);
        headers = ["date", "total_uploads", "successful", "failed"];
        filename = `analytics_${new Date().toISOString().split('T')[0]}`;
    }
    
    if (format === "csv") {
      const csvContent = generateCSV(data, headers);
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "json") {
      // return json for pdf generation on frontend
      return NextResponse.json({
        success: true,
        data: {
          filename,
          headers,
          rows: data,
          generatedAt: new Date().toISOString(),
          dateRange: `${dateRange} days`,
          metrics,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "invalid format. use 'csv' or 'json'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("error generating export:", error);
    return NextResponse.json(
      { success: false, error: "failed to generate export" },
      { status: 500 }
    );
  }
}
