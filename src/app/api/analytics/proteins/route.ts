import { NextRequest, NextResponse } from "next/server";

// mock data for protein type distribution
const proteinTypes = [
  { name: "enzymes", count: 2847, color: "#3c50e0", percentage: 28.5 },
  { name: "membrane proteins", count: 1956, color: "#10b981", percentage: 19.6 },
  { name: "antibodies", count: 1523, color: "#f59e0b", percentage: 15.2 },
  { name: "transport proteins", count: 1234, color: "#8b5cf6", percentage: 12.3 },
  { name: "structural proteins", count: 987, color: "#ef4444", percentage: 9.9 },
  { name: "signaling proteins", count: 756, color: "#06b6d4", percentage: 7.6 },
  { name: "storage proteins", count: 432, color: "#84cc16", percentage: 4.3 },
  { name: "other", count: 265, color: "#6b7280", percentage: 2.6 },
];

const generateMockProteinData = (userId?: string) => {
  if (userId) {
    // return personalized data for specific user
    return proteinTypes.map(type => ({
      ...type,
      count: Math.floor(type.count * (Math.random() * 0.1 + 0.01)),
    })).filter(type => type.count > 0);
  }
  return proteinTypes;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    const proteinData = generateMockProteinData(userId || undefined);
    const totalCount = proteinData.reduce((sum, type) => sum + type.count, 0);
    
    // recalculate percentages
    const dataWithPercentages = proteinData.map(type => ({
      ...type,
      percentage: parseFloat(((type.count / totalCount) * 100).toFixed(1)),
    }));
    
    // get top protein type
    const topProteinType = dataWithPercentages.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    );
    
    return NextResponse.json({
      success: true,
      data: {
        distribution: dataWithPercentages,
        summary: {
          totalProteins: totalCount,
          uniqueTypes: dataWithPercentages.length,
          topProteinType: topProteinType.name,
          topProteinPercentage: topProteinType.percentage,
        },
      },
    });
  } catch (error) {
    console.error("error fetching protein analytics:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch protein analytics" },
      { status: 500 }
    );
  }
}
