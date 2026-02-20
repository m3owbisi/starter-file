import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/mongoose";
import Message from "@/lib/database/models/message.model";
import Group from "@/lib/database/models/group.model";

/**
 * GET /api/messages?groupId=xxx&page=1&limit=50
 *
 * returns paginated, chronologically sorted messages for a group.
 * sender details are populated automatically.
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId query parameter is required" },
        { status: 400 },
      );
    }

    // verify the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "group not found" },
        { status: 404 },
      );
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "firstName lastName photo");

    const totalCount = await Message.countDocuments({ groupId });

    return NextResponse.json({
      messages,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages
 * body: { groupId, senderId, messageText }
 *
 * persists a message to the database and returns the populated document.
 * the caller should emit the returned message via the real-time channel
 * AFTER this call succeeds — ensuring database-first persistence.
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { groupId, senderId, messageText } = body;

    if (!groupId || !senderId || !messageText?.trim()) {
      return NextResponse.json(
        { error: "groupId, senderId, and messageText are required" },
        { status: 400 },
      );
    }

    // verify the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "group not found" },
        { status: 404 },
      );
    }

    const newMessage = await Message.create({
      groupId,
      senderId,
      messageText: messageText.trim(),
    });

    const populated = await Message.findById(newMessage._id).populate(
      "senderId",
      "firstName lastName photo",
    );

    return NextResponse.json({ message: populated }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: error.message || "internal server error" },
      { status: 500 },
    );
  }
}
