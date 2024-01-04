import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from "get-video-duration";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;
  if (
    [title, description].some(
      (field) => field === undefined || field?.trim() === ""
    )
  ) {
    throw new ApiError("401", "All is required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError("401", "videoFile is required");
  }
  const calculatedDuration = await getVideoDurationInSeconds(videoLocalPath); // getVideoDurationInSeconds

  if (!thumbnailLocalPath) {
    throw new ApiError(401, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  if (!videoFile) {
    throw new ApiError(401, "required strong internet to upload video");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(401, "thumbnail is required try again");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: calculatedDuration,
    owner: userId,
  });

  const isOploaded = await Video.findById(video._id);

  if (!isOploaded) {
    throw new ApiError(401, "some thing went wrong while uploading video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video oploaded successfully"));
}, "uploadVideo");

/* 
Increase Video View Count:
Endpoint: PUT /api/videos/:id/increase-view
Description: Increment the view count of a video.

Toggle Video Privacy:
Endpoint: PUT /api/videos/:id/toggle-privacy
Description: Toggle the privacy status of a video (public/private).

Search Videos:
Endpoint: GET /api/videos/search?q=query
Description: Search for videos based on a query string.

Get Trending Videos:
Endpoint: GET /api/videos/trending
Description: Retrieve a list of trending videos.

Get Recommended Videos:
Endpoint: GET /api/videos/recommended
Description: Retrieve a list of videos recommended for the current user. */

const getAllVideo = asyncHandler(async (req, res) => {
  const videos = await Video.find(
    {},
    {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      view: 1,
      owner: 1,
    }
  );

  if (videos.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No videos exist"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "fetched all video"));
}, "getAllVideo");

const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(401, "bad request");
  }
  const video = await Video.findById(id);

  if (!video) {
    throw new ApiError(404, "video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetch successfully"));
}, "getVideoById");

const updateVideoDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { title, description } = req.body;

  const existingVideo = await Video.findById(id);
  if (existingVideo.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  if (!existingVideo) {
    throw new ApiError(404, "Video does not exit");
  }

  let updateDetails;
  if (title || description) {
    if (title && description) {
      updateDetails = await Video.findByIdAndUpdate(
        id,
        {
          $set: {
            title,
            description,
          },
        },
        { new: true }
      );
    } else if (title) {
      updateDetails = await Video.findByIdAndUpdate(
        id,
        {
          $set: {
            title,
          },
        },
        { new: true }
      );
    } else {
      updateDetails = await Video.findByIdAndUpdate(
        id,
        {
          $set: {
            description,
          },
        },
        { new: true }
      );
    }
  } else {
    throw new ApiError(401, "fields are required");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateDetails, "details are updated successfully")
    );
}, "updateVideoDetails");

const updateThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const userId = req.user._id;

  const existingVideo = await Video.findById(id);
  if (existingVideo.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(401, "thumbnail is required");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(401, "slow interent problem try again later");
  }

  const video = await Video.findByIdAndUpdate(
    id,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "thumbnail updated successfully"));
}, "updateThumbnail");

const deleteVideo = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const currentUserId = req.user._id;
  const video = await Video.findById(id);
  let videodeleted;

  if (video.owner.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  } else {
    videodeleted = await Video.findByIdAndDelete(id);
  }

  if (!videodeleted) {
    throw new ApiError(401, "something went wrong");
  }
  console.log("videodeleted", videodeleted);

  return res
    .status(200)
    .json(new ApiResponse(200, "video delete successfully"));
}, "deleteVideo");

const getUserVideoById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(402, "user is required");
  }
  const userVideos = await Video.find({ owner: userId });

  if (userVideos.length === 0) {
    throw new ApiResponse(200, [], "user does not have video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userVideos, "user Video fetched successfully"));
}, "getUserVideoById");

export {
  uploadVideo,
  getAllVideo,
  getVideoById,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
  getUserVideoById,
};
