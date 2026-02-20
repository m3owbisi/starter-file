import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  getUserTheme,
  updateUserTheme,
} from "@/lib/actions/settings.actions";

async function getAuthenticatedEmail(): Promise<string | null> {
  const session = (await getServerSession()) as any;
  return session?.user?.email ?? null;
}

// GET /api/user/settings — returns { theme: "dark" | "light" }
export async function GET() {
  try {
    const email = await getAuthenticatedEmail();
    if (!email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const theme = await getUserTheme(email);
    return NextResponse.json({ theme }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/user/settings — body: { theme: "dark" | "light" }
export async function PUT(request: NextRequest) {
  try {
    const email = await getAuthenticatedEmail();
    if (!email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { theme } = await request.json();
    if (theme !== "dark" && theme !== "light") {
      return NextResponse.json({ error: "invalid theme" }, { status: 400 });
    }
    const saved = await updateUserTheme(email, theme);
    return NextResponse.json({ theme: saved }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: 500 },
    );
  }
}
