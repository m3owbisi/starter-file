import { Schema, model, models } from "mongoose";

/**
 * dedicated message collection
 *
 * why a separate collection instead of embedding inside group?
 * ─────────────────────────────────────────────────────────────
 * 1. mongodb documents have a 16 MB size limit — embedded message
 *    arrays will eventually hit this ceiling in active groups.
 * 2. a separate collection allows compound indexes (groupId + createdAt)
 *    for lightning-fast chronological queries.
 * 3. pagination (skip/limit or cursor-based) is trivial on a flat
 *    collection; it's painful on embedded arrays.
 * 4. individual messages can be updated/deleted without rewriting
 *    the entire parent document.
 * 5. analytics queries (message counts, activity heat-maps) are
 *    far more efficient on a dedicated collection.
 */

const MessageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "group",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    messageText: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // auto-generates createdAt & updatedAt
  },
);

// compound index for fast chronological message retrieval per group
MessageSchema.index({ groupId: 1, createdAt: 1 });

const Message = models?.message || model("message", MessageSchema);

export default Message;
