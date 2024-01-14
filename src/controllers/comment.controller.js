import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import { Video } from "../models/video.models";

const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(401, "video is required");
  }

  const skip = (page - 1) * limit;

  const comments = await Comment.findById(videoId).limit(limit).skip(skip);

  if (!comments) {
    throw new ApiResponse(200, [], "no comments on this video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "fetch successfully"));
});

export { getVideoComment };
