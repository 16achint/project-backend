import { asyncHandler } from "../utils/asyncHandler";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name.trim()) {
    throw new ApiError(401, "name is required");
  }
  if (!description.trim()) {
    throw new ApiError(401, "description is requrired");
  }

  const playlist = await Playlist.create({
    name,
    description,
  });

  if (!playlist) {
    throw new ApiError(500, "connection error try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playList created successfully"));
});

const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId } = req.param;
  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "userId is incorrect");
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const playList = await Playlist.aggregate(
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "playlistVideo",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        playlistVideo: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    }
  );

  if (!playList) {
    throw new ApiError(500, "check your connection error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "playList fetched successfully"));
});

export { createPlaylist, getUserPlayList };
