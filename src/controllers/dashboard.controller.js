import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";

const getChannelStates = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { userId } = req.user._id;

  if (!userId || isValidObjectId(userId)) {
    throw new ApiError(400, "user id is invalid");
  }

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
      $lookup: {
        from: "",
      },
    },
  ];
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { userId } = req.user?._id;

  if (!userId || isValidObjectId(userId)) {
    throw new ApiError(400, "user id is required");
  }
  const video = await Video.find({ owner: id });

  if (!video || video.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "no video published yet"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "All video fetched successfully"));
});

export { getChannelStates, getChannelVideos };
