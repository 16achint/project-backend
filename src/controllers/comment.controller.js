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

const addComment = asyncHandler(async (req, res) => {
  const videoId = req.params;
  const owner = req.user._id;
  const { content } = req.body;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(401, "video is required...");
  }
  if (!owner) {
    throw new ApiError(401, "login and try again");
  }
  if (!content.trim()) {
    throw new ApiError(401, "content is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comments = await Comment.create({
    content,
    owner,
    video: videoId,
  });

  if (!comments) {
    throw new ApiError("500", "connection is not stable");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "comment added successfully..."));
});

const updateComment = asyncHandler(async (req, res) => {
  const id = req.param;
  const { content } = req.body;

  if (!content.trim()) {
    throw new ApiError(401, "content is required");
  }
  const Comment = await Comment.findByIdAndUpdate(
    id,
    {
      contnet: content,
    },
    { new: true }
  );

  if (!Comment) {
    throw new ApiError(500, "connection lost try again later...");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, Comment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.param;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (comment?.owner.toString() != req.user._id.toString()) {
    throw new ApiError(400, "you don't have permission to delete the comment");
  }
  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "your comment deleted successfully"));
});

export { getVideoComment, addComment, updateComment, deleteComment };
