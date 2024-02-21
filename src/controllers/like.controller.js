import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId.trim())) {
    throw new ApiError(400, "video Id is invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not exist");
  }

  const isLike = await Like.find({
    video: videoId,
    likedBy: req.user._id,
  });

  if (isLike.length == 0) {
    const like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!like) {
      throw new ApiError(500, "Internal error try again later");
    }
    return res.status(200).json(new ApiResponse(200, {}, "liked"));
  } else {
    const deleteLike = await Like.findByIdAndDelete(isLike[0]._id);
    if (!deleteLike) {
      throw new ApiError(500, "Internal error try again later");
    }
    return res.status(200).json(new ApiResponse(200, {}, "remove like"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId.trim())) {
    throw new ApiError(400, "comment id is not valid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  const isLiked = await Like.find({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (isLiked.length == 0) {
    const like = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!like) {
      throw new ApiError(500, "Internal server error try again later");
    }
    return res.status(200).json(new ApiResponse(200, {}, "like comment"));
  } else {
    const deleteLike = await Like.findByIdAndDelete(isLiked[0]._id);

    return res
      .status(200)
      .json(new ApiResponse(200, "remove like from comment"));
  }
});

const toogleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId.trim())) {
    throw new ApiError(400, "tweet Id is invalid");
  }

  const isLiked = await Tweet.findById(tweetId);

  if (!isLiked) {
    const tweetLike = await Like.create({
      Tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!tweetLike) {
      throw new ApiError(500, "Internal server error");
    }

    return res.status(200).json(new ApiResponse(200, tweetLike, "tweet liked"));
  } else {
    const deleteLike = await Like.findByIdAndDelete(isLiked[0]._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "remove liked from tweet "));
  }
});

const getLikedVideo = asyncHandler(async (req, res) => {
  // complete like controller
});

export { toggleVideoLike, toggleCommentLike, toogleTweetLike, getLikedVideo };
