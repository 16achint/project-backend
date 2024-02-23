import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.models.js";

const getVideoComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(401, "video is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    // If the video doesn't exist, delete all comments associated with the video ID
    await Comment.deleteMany({ video: videoId });
    throw new ApiError(
      400,
      "There is no such Video. All associated comments have been deleted."
    );
  }

  const commentAggregate = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCounts: {
          $size: "$likes",
        },
        owner: {
          $first: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        likesCounts: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        isLiked: 1,
      },
    },
  ];

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const comments = await Comment.aggregate(commentAggregate)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const totalComment = await Comment.countDocuments({ video: videoId });
  const totalPages = Math.ceil(totalComment / limit);

  if (page > totalPages) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          [],
          "no more comment avaiable for this requrested page"
        )
      );
  }

  if (!comments || comments.length == 0) {
    throw new ApiError(200, [], "no comments on this video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "fetch successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
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
    .json(new ApiResponse(200, comments, "comment added successfully..."));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "id is invalid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (!content.trim()) {
    throw new ApiError(401, "content is required");
  }

  const updatecomment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: content,
    },
    { new: true }
  );

  if (!updatecomment) {
    throw new ApiError(500, "connection lost try again later...");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatecomment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "comment id is invalid");
  }

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
