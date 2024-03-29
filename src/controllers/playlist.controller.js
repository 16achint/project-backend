import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";

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
    videos: [],
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "connection error try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playList created successfully"));
});

const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "userId is incorrect");
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const playList = await Playlist.aggregate([
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
    },
  ]);

  if (!playList) {
    throw new ApiError(500, "check your connection error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playList, "playList fetched successfully"));
});

const getPlaylistbyId = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId.trim()) {
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

  if (!playlistId.trim() || !videoId.trim()) {
    throw new ApiError(400, "playlistId or videoId not valid");
  }

  const video = await Video.findById(videoId);

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(404, "video does not exist on your channel");
  }

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  const playlist = await Playlist.findById(playlistId);

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
  const { playlistId, videoId } = req.params;

  if (!playlistId.trim() || !videoId.trim()) {
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

  const removeVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: new mongoose.Types.ObjectId(videoId) },
    },
    { new: true }
  );
  if (!removeVideo) {
    throw new ApiError(500, "Internal server error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "video remove from playlist"));
});

const deletePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "playlist Id or video Id is invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "playlist not found");
  }

  const deletePlayList = await Playlist.findByIdAndDelete(playlistId);

  if (!deletePlayList) {
    throw new ApiError(500, "connection error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId.trim())) {
    throw new ApiError(400, "playlist id is invalid");
  }

  if (!name.trim() && !description.trim()) {
    throw new ApiError(400, "name and description are required");
  }

  const playList = await Playlist.findById([playlistId]);

  if (!playList) {
    throw new ApiError(404, "playList not exist");
  }

  const updatePlayList = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  if (!updatePlayList) {
    throw new ApiError(500, "connection error try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlayList, "Playlist is updated"));
});

export {
  createPlaylist,
  getUserPlayList,
  getPlaylistbyId,
  addVideotoPlaylist,
  removeVideoFromPlaylist,
  deletePlayList,
  updatePlaylist,
};
