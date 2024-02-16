import { asyncHandler } from "../utils/asyncHandler";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models";

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

const getPlaylistbyId = asyncHandler(async (req, res) => {
  const { playlistId } = req.param;

  if (isValidObjectId(playlistId)) {
    throw new ApiError(400, "playList id miss matched");
  }
  const playlistAccess = await Playlist.findById(playlistId);

  if (!playlistAccess) {
    throw new ApiError(404, "playlist does not exist");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideo",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              duration: 1,
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
    },
  ]);

  if (playlist.length == 0) {
    throw new ApiError(404, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully"));
});

const addVideotoPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || isValidObjectId(videoId)) {
    throw new ApiError(400, "playlistId or videoId not valid");
  }

  const video = await Video.find(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const playlist = await Playlist.find(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playList not exist");
  }

  if (playlist.videos.includes(new mongoose.Types.ObjectId(videoId))) {
    throw new ApiError(500, "video already exist");
  }

  const addVideotoPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: new mongoose.Types.ObjectId(videoId) },
    },
    { new: true }
  );

  if (!addVideotoPlaylist) {
    throw new ApiError(500, "can't added a video in playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video added successfully in playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.param;

  if (
    !isValidObjectId(playlistId.trim()) ||
    !isValidObjectId(videoId.playlistId.trim())
  ) {
    throw new ApiError(400, "playlist Id or video Id is invalid");
  }

  const playList = await Playlist.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "playlist not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not exist");
  }

  const removeVideo = Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: new mongoose.Types.ObjectId(videoId) },
    },
    { new: true }
  );
  if (!removeVideo) {
    throw new ApiError(500, "Internal server error");
  }

  return res.status(200).json(new ApiError(200, "video remove from playlist"));
});

export {
  createPlaylist,
  getUserPlayList,
  getPlaylistbyId,
  addVideotoPlaylist,
  removeVideoFromPlaylist,
};
