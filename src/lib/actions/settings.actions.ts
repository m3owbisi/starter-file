"use server";

import User from "../database/models/user.model";
import { connectToDatabase } from "../database/mongoose";

/**
 * Get the user's saved theme. Falls back to "light" if not set.
 */
export async function getUserTheme(email: string): Promise<"dark" | "light"> {
  try {
    await connectToDatabase();
    const user = await User.findOne({ email }).select("theme").lean();
    if (!user) return "light";
    return ((user as any).theme === "dark" ? "dark" : "light");
  } catch (err) {
    console.error("getUserTheme error:", err);
    return "light";
  }
}

/**
 * Persist the user's theme choice to the database.
 */
export async function updateUserTheme(
  email: string,
  theme: "dark" | "light",
): Promise<"dark" | "light"> {
  try {
    await connectToDatabase();

    // validate
    if (theme !== "dark" && theme !== "light") {
      throw new Error("invalid theme value");
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: { theme } },
      { new: true, runValidators: true },
    )
      .select("theme")
      .lean();

    if (!updated) throw new Error("user not found");
    return (updated as any).theme === "dark" ? "dark" : "light";
  } catch (err) {
    console.error("updateUserTheme error:", err);
    return theme; // return the requested value as fallback
  }
}
