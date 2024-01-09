import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      require: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      req: "User",
    },
    video: {
      type: Schema.Types.ObjectId,
      req: "Video",
    },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
