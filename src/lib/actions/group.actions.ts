"use server";
import mongoose from "mongoose";
import Group from "../database/models/group.model";
import Message from "../database/models/message.model";
import { connectToDatabase } from "../database/mongoose";
import { handleError } from "../utils";

// ─────────────────────────────────────────────────────────
// group actions
// ─────────────────────────────────────────────────────────

export async function createGroup(
  groupName: string,
  creatorId: string,
  memberIds: string[] = [],
) {
  try {
    await connectToDatabase();

    const members = Array.from(
      new Set([
        creatorId,
        ...memberIds.map((id) => new mongoose.Types.ObjectId(id)),
      ]),
    );

    const newGroup = await Group.create({
      name: groupName,
      createdBy: creatorId,
      members,
    });

    return JSON.parse(JSON.stringify(newGroup));
  } catch (error) {
    console.error("error creating group:", error);
    handleError(error);
  }
}

export async function addMemberToGroup(groupId: string, userId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("group not found");

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    return JSON.parse(JSON.stringify(group));
  } catch (error) {
    console.error("error adding member to group:", error);
    handleError(error);
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  userId: string,
) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId);
    if (!group) throw new Error("group not found");

    group.members = group.members.filter(
      (m: any) => m.toString() !== userId,
    );
    await group.save();

    return JSON.parse(JSON.stringify(group));
  } catch (error) {
    console.error("error removing member from group:", error);
    handleError(error);
  }
}

export async function getGroupById(groupId: string) {
  try {
    await connectToDatabase();

    const group = await Group.findById(groupId).populate(
      "members",
      "firstName lastName photo",
    );
    if (!group) throw new Error("group not found");

    return JSON.parse(JSON.stringify(group));
  } catch (error) {
    console.error("error retrieving group:", error);
    handleError(error);
  }
}

export async function getAllGroups() {
  try {
    await connectToDatabase();

    const groups = await Group.find().populate(
      "members",
      "firstName lastName photo",
    );

    return JSON.parse(JSON.stringify(groups));
  } catch (error) {
    console.error("error retrieving groups:", error);
    handleError(error);
  }
}

export async function deleteGroup(groupId: string) {
  try {
    await connectToDatabase();

    // delete all messages in the group first
    await Message.deleteMany({ groupId });
    // then delete the group itself
    const deleted = await Group.findByIdAndDelete(groupId);
    if (!deleted) throw new Error("group not found");

    return { success: true };
  } catch (error) {
    console.error("error deleting group:", error);
    handleError(error);
  }
}

// ─────────────────────────────────────────────────────────
// message actions (dedicated collection)
// ─────────────────────────────────────────────────────────

/**
 * save a message to the database.
 * this must be called BEFORE emitting via the real-time channel
 * so that the message is persisted even if the socket broadcast fails.
 */
export async function addMessageToGroup(
  groupId: string,
  senderId: string,
  messageText: string,
) {
  try {
    await connectToDatabase();

    // verify group exists
    const group = await Group.findById(groupId);
    if (!group) throw new Error("group not found");

    const newMessage = await Message.create({
      groupId,
      senderId,
      messageText,
    });

    // populate sender details so the caller gets a complete object
    const populated = await Message.findById(newMessage._id).populate(
      "senderId",
      "firstName lastName photo",
    );

    return JSON.parse(JSON.stringify(populated));
  } catch (error) {
    console.error("error adding message to group:", error);
    handleError(error);
  }
}

/**
 * fetch paginated messages for a group, sorted chronologically.
 *
 * @param groupId  – the group to fetch messages for
 * @param page     – page number (1-indexed, default 1)
 * @param limit    – messages per page (default 50)
 */
export async function getGroupMessages(
  groupId: string,
  page: number = 1,
  limit: number = 50,
) {
  try {
    await connectToDatabase();

    const skip = (page - 1) * limit;

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 }) // oldest first — chronological
      .skip(skip)
      .limit(limit)
      .populate("senderId", "firstName lastName photo");

    const totalCount = await Message.countDocuments({ groupId });

    return {
      messages: JSON.parse(JSON.stringify(messages)),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("error retrieving group messages:", error);
    handleError(error);
  }
}