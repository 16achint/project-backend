import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from "get-video-duration";

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

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
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(401, "required strong internet to upload video");
  }

  if (!thumbnail) {
    throw new ApiError(401, "thumbnail is required try again");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: calculatedDuration,
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

Delete Video:
Endpoint: DELETE /api/videos/:id
Description: Delete a specific video.

Get User Videos:
Endpoint: GET /api/videos/user/:userId
Description: Retrieve all videos uploaded by a specific user.

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
  const { title, description } = req.body;

  const existingVideo = await Video.findById(id);

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

export {
  uploadVideo,
  getAllVideo,
  getVideoById,
  updateVideoDetails,
  updateThumbnail,
};
