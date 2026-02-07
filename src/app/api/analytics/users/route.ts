import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// mock data for user demographics (admin only)
const countryData = [
  { country: "united states", countryCode: "us", users: 3456, percentage: 28.5 },
  { country: "united kingdom", countryCode: "gb", users: 1823, percentage: 15.0 },
  { country: "germany", countryCode: "de", users: 1456, percentage: 12.0 },
  { country: "japan", countryCode: "jp", users: 1234, percentage: 10.2 },
  { country: "china", countryCode: "cn", users: 1098, percentage: 9.1 },
  { country: "india", countryCode: "in", users: 876, percentage: 7.2 },
  { country: "canada", countryCode: "ca", users: 654, percentage: 5.4 },
  { country: "france", countryCode: "fr", users: 543, percentage: 4.5 },
  { country: "australia", countryCode: "au", users: 432, percentage: 3.6 },
  { country: "brazil", countryCode: "br", users: 321, percentage: 2.6 },
  { country: "others", countryCode: "other", users: 239, percentage: 1.9 },
];

const institutionTypes = [
  { type: "universities", count: 4567, percentage: 45.2 },
  { type: "research institutes", count: 2345, percentage: 23.2 },
  { type: "pharmaceutical companies", count: 1876, percentage: 18.6 },
  { type: "biotech startups", count: 876, percentage: 8.7 },
  { type: "hospitals", count: 432, percentage: 4.3 },
];

const roleDistribution = [
  { role: "researchers", count: 6543, percentage: 54.0 },
  { role: "students", count: 3210, percentage: 26.5 },
  { role: "professors", count: 1234, percentage: 10.2 },
  { role: "industry scientists", count: 876, percentage: 7.2 },
  { role: "others", count: 254, percentage: 2.1 },
];

export async function GET(request: NextRequest) {
  try {
    // note: in production, check for admin role here
    // const session = await getServerSession();
    // if (!session?.user || session.user.role !== 'admin') {
    //   return NextResponse.json({ success: false, error: "unauthorized" }, { status: 403 });
    // }
    
    const totalUsers = countryData.reduce((sum, country) => sum + country.users, 0);
    
    // calculate new users (mock - last 30 days)
    const newUsersThisMonth = Math.floor(totalUsers * 0.12);
    const newUsersLastMonth = Math.floor(totalUsers * 0.10);
    const userGrowth = ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1);
    
    // active users (mock - 60% of total)
    const activeUsers = Math.floor(totalUsers * 0.6);
    
    return NextResponse.json({
      success: true,
      data: {
        demographics: {
          byCountry: countryData,
          byInstitution: institutionTypes,
          byRole: roleDistribution,
        },
        summary: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          userGrowth: parseFloat(userGrowth),
          topCountry: countryData[0].country,
          topCountryPercentage: countryData[0].percentage,
        },
      },
    });
  } catch (error) {
    console.error("error fetching user demographics:", error);
    return NextResponse.json(
      { success: false, error: "failed to fetch user demographics" },
      { status: 500 }
    );
  }
}
