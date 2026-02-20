import { Schema, model, models } from "mongoose";

/**
 * group collection
 *
 * messages are NO LONGER embedded here — they live in the
 * dedicated "message" collection and are linked via groupId.
 * this keeps group documents small and queryable.
 */

const GroupSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  // legacy "messages" sub-array intentionally removed —
  // use the Message collection instead
});

const group = models?.group || model("group", GroupSchema);

export default group;