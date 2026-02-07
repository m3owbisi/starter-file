import { NextRequest, NextResponse } from "next/server";

// mock data for user activity
const generateMockActivityData = (days: number = 30, userId?: string) => {
  const data = [];
  const today = new Date();
  
  const actions = ["login", "upload", "prediction", "view_protein", "export"];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // generate activity counts for each action type
    const dayData: any = {
      date: date.toISOString().split('T')[0],
    };
    
    let totalActivity = 0;
    actions.forEach(action => {
      const count = userId 
        ? Math.floor(Math.random() * 5) + 1
        : Math.floor(Math.random() * 300) + 50;
      dayData[action] = count;
      totalActivity += count;
    });
    
    dayData.total = totalActivity;
    data.push(dayData);
  }
  
  return data;
};

// hourly activity distribution (for today)
const generateHourlyActivity = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    // simulate typical usage patterns (peak during work hours)
    let baseActivity = 50;
    if (i >= 9 && i <= 17) baseActivity = 200;  // work hours
    if (i >= 12 && i <= 14) baseActivity = 150; // lunch dip
    if (i >= 0 && i <= 6) baseActivity = 20;   // night time
    
    hours.push({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      activity: baseActivity + Math.floor(Math.random() * 50),
    });
  }
  return hours;
};

// recent activity feed
const generateRecentActivity = (userId?: string) => {
  const activities = [
    { action: "upload", description: "uploaded protein dataset 'hemoglobin_structure.pdb'", time: "2 minutes ago" },
    { action: "prediction", description: "ran binding prediction on 'insulin receptor'", time: "15 minutes ago" },
    { action: "view_protein", description: "viewed protein structure 'cytochrome c'", time: "32 minutes ago" },
    { action: "export", description: "exported analysis results to csv", time: "1 hour ago" },
    { action: "upload", description: "uploaded protein dataset 'kinase_family.fasta'", time: "2 hours ago" },
    { action: "prediction", description: "ran binding prediction on 'atp synthase'", time: "3 hours ago" },
    { action: "login", description: "logged in from new device", time: "5 hours ago" },
    { action: "view_protein", description: "viewed protein structure 'collagen type i'", time: "6 hours ago" },
  ];
  
  return userId ? activities.slice(0, 5) : activities;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "30";
    const userId = searchParams.get("userId");
    
    const days = parseInt(dateRange);
    const activityData = generateMockActivityData(days, userId || undefined);
    const hourlyData = generateHourlyActivity();
    const recentActivity = generateRecentActivity(userId || undefined);
    
    // calculate summary metrics
    const totalActivity = activityData.reduce((sum, day) => sum + day.total, 0);
    const avgDailyActivity = (totalActivity / days).toFixed(0);
    
    // peak activity day
    const peakDay = activityData.reduce((prev, current) => 
      prev.total > current.total ? prev : current
    );
    
    // peak hour
    const peakHour = hourlyData.reduce((prev, current) => 
      prev.activity > current.activity ? prev : current
    );
    
    // action breakdown
    const actionTotals = {
      logins: activityData.reduce((sum, d) => sum + (d.login || 0), 0),
      uploads: activityData.reduce((sum, d) => sum + (d.upload || 0), 0),
      predictions: activityData.reduce((sum, d) => sum + (d.prediction || 0), 0),
      views: activityData.reduce((sum, d) => sum + (d.view_protein || 0), 0),
      exports: activityData.reduce((sum, d) => sum + (d.export || 0), 0),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        dailyData: activityData,
        hourlyData,
        recentActivity,
        actionBreakdown: actionTotals,
        summary: {
          totalActivity,
          avgDailyActivity: parseInt(avgDailyActivity),
          peakActivityDay: peakDay.date,
          peakActivityHour: peakHour.hourLabel,
          mostCommonAction: "view_protein",
        },
      },
    });
  } catch (error) {
    console.error("error fetching activity analytics:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch activity analytics" },
      { status: 500 }
    );
  }
}
