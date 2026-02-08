import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

// mock data for upload statistics
const generateMockUploadData = (days: number = 30, userId?: string) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // generate random upload counts with some variation
    const baseCount = userId ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 50) + 10;
    const variation = Math.floor(Math.random() * 20) - 10;
    
    data.push({
      date: date.toISOString().split('T')[0],
      uploads: Math.max(0, baseCount + variation),
      successfulUploads: Math.max(0, Math.floor((baseCount + variation) * 0.92)),
      failedUploads: Math.max(0, Math.floor((baseCount + variation) * 0.08)),
    });
  }
  
  return data;
};

const generateMockTrends = (currentPeriod: number[], previousPeriod: number[]) => {
  const currentTotal = currentPeriod.reduce((a, b) => a + b, 0);
  const previousTotal = previousPeriod.reduce((a, b) => a + b, 0);
  
  if (previousTotal === 0) return 0;
  return ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "30";
    const userId = searchParams.get("userId");
    
    const days = parseInt(dateRange);
    const uploadData = generateMockUploadData(days, userId || undefined);
    
    // calculate totals
    const totalUploads = uploadData.reduce((sum, day) => sum + day.uploads, 0);
    const successfulUploads = uploadData.reduce((sum, day) => sum + day.successfulUploads, 0);
    const failedUploads = uploadData.reduce((sum, day) => sum + day.failedUploads, 0);
    
    // calculate trend (comparing to previous period)
    const currentPeriodData = uploadData.slice(-Math.floor(days / 2)).map(d => d.uploads);
    const previousPeriodData = uploadData.slice(0, Math.floor(days / 2)).map(d => d.uploads);
    const trend = generateMockTrends(currentPeriodData, previousPeriodData);
    
    return NextResponse.json({
      success: true,
      data: {
        dailyData: uploadData,
        summary: {
          totalUploads,
          successfulUploads,
          failedUploads,
          successRate: ((successfulUploads / totalUploads) * 100).toFixed(1),
          trend: parseFloat(trend as string),
          averagePerDay: (totalUploads / days).toFixed(1),
        },
      },
    });
  } catch (error) {
    console.error("error fetching upload analytics:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch upload analytics" },
      { status: 500 }
    );
  }
}
