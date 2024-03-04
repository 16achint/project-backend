import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";

const getChannelStates = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "user id is invalid");
  }

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "like",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $group: {
        _id: null,
        TotalVideos: { $sum: 1 },
        TotalViews: { $sum: "$view" },
        TotalSubscribers: {
          $first: {
            $cond: [{ $isArray: "$subscribers" }, { $size: "$subscribers" }, 0],
          },
        },
        TotalLikes: {
          $first: {
            $cond: [{ $isArray: "$like" }, { $size: "$like" }, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        TotalVideos: 1,
        TotalViews: 1,
        TotalSubscribers: 1,
        TotalLikes: 1,
      },
    },
  ];

  const states = await Video.aggregate(pipeline);

  if (!states) {
    throw new ApiError(500, "some thing went worng");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, states, "states fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  console.log("userId => ", userId);

  if (!userId) {
    throw new ApiError(400, "user id is required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  const video = await Video.find({ owner: userId });

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
