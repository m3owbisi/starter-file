import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// mock data for binding prediction success rates
const generateMockBindingData = (days: number = 30, userId?: string) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // generate random prediction counts
    const totalPredictions = userId 
      ? Math.floor(Math.random() * 10) + 1 
      : Math.floor(Math.random() * 200) + 50;
    
    // success rate varies between 75-95%
    const successRate = 75 + Math.random() * 20;
    const successfulPredictions = Math.floor(totalPredictions * (successRate / 100));
    
    data.push({
      date: date.toISOString().split('T')[0],
      totalPredictions,
      successfulPredictions,
      failedPredictions: totalPredictions - successfulPredictions,
      successRate: parseFloat(successRate.toFixed(1)),
    });
  }
  
  return data;
};

// affinity distribution data
const affinityDistribution = [
  { range: "very high (< 1nm)", count: 234, percentage: 12.5 },
  { range: "high (1-10nm)", count: 567, percentage: 30.3 },
  { range: "moderate (10-100nm)", count: 678, percentage: 36.2 },
  { range: "low (100nm-1μm)", count: 298, percentage: 15.9 },
  { range: "very low (> 1μm)", count: 95, percentage: 5.1 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "30";
    const userId = searchParams.get("userId");
    
    const days = parseInt(dateRange);
    const bindingData = generateMockBindingData(days, userId || undefined);
    
    // calculate overall metrics
    const totalPredictions = bindingData.reduce((sum, day) => sum + day.totalPredictions, 0);
    const successfulPredictions = bindingData.reduce((sum, day) => sum + day.successfulPredictions, 0);
    const overallSuccessRate = ((successfulPredictions / totalPredictions) * 100).toFixed(1);
    
    // calculate trend
    const recentDays = bindingData.slice(-7);
    const earlierDays = bindingData.slice(-14, -7);
    const recentAvg = recentDays.reduce((sum, d) => sum + d.successRate, 0) / recentDays.length;
    const earlierAvg = earlierDays.reduce((sum, d) => sum + d.successRate, 0) / earlierDays.length;
    const trend = ((recentAvg - earlierAvg) / earlierAvg * 100).toFixed(1);
    
    return NextResponse.json({
      success: true,
      data: {
        dailyData: bindingData,
        affinityDistribution: userId ? null : affinityDistribution,
        summary: {
          totalPredictions,
          successfulPredictions,
          failedPredictions: totalPredictions - successfulPredictions,
          overallSuccessRate: parseFloat(overallSuccessRate),
          trend: parseFloat(trend),
          averagePerDay: (totalPredictions / days).toFixed(1),
        },
      },
    });
  } catch (error) {
    console.error("error fetching binding analytics:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch binding analytics" },
      { status: 500 }
    );
  }
}
