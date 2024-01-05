import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from "get-video-duration";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

const userProgress = new Map();

const generateTempUid = () => {
  return uuidv4();
};

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
  console.log("checking point");
  const { id } = req.params;
  const temporaryToken = req.cookies?.temporaryUid || generateTempUid();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const progress = userProgress.get(temporaryToken);

  if (!progress || progress.videoId !== id) {
    userProgress.set(temporaryToken, {
      videoId: id,
      startTime: Date.now(),
      watchedTime: 0,
    });
  }
  const video = await Video.findById(id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const percentageViewed = (userProgress.watchedTime / video.duration) * 100;

  if (percentageViewed >= 50) {
    const video = await Video.findByIdAndUpdate(
      id,
      {
        $inc: { view: 1 },
      },
      { new: true, select: "_id title view" }
    );

    res
      .status(200)
      .json(new ApiResponse(200, video, "Video fetched and count increased"));
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(200, video, "Video fetched, but count not increased")
      );
  }
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

const increaseVideoCount = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "id is required");
  }

  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(404, "video does exist");
  }

  const updated = await Video.findByIdAndUpdate(
    id,
    {
      $inc: { view: 1 },
    },
    { new: true, select: "_id title view" }
  );

  return res.status(200);
}, "increaseVideoCount");

const videoPrivacy = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { isPublished } = req.body;

  if (!id) {
    throw new ApiError(401, "video is required");
  }

  const video = await Video.findByIdAndUpdate(
    id,
    {
      $set: {
        isPublished,
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "video does not exist");
  }

  let message = "video is private successfully";
  if (video.isPublished) {
    message = "video is public successfully";
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, { isPublished: video.isPublished }, `${message}`)
    );
}, "videoPrivacy");

const searchVideo = asyncHandler(async (req, res) => {
  const userQuery = req.query.q.toLowerCase();

  if (!userQuery) {
    return res
      .status(400)
      .json(new ApiResponse(400, [], "Invalid search query"));
  }

  // using mongoes wildcard indexing for search

  // const searchPipeline = [
  //   {
  //     $search: {
  //       index: "searchVideo",
  //       text: {
  //         query: userQuery,
  //         path: {
  //           wildcard: "*",
  //         },
  //       },
  //     },
  //   },
  // ];
  // const videos = await Video.aggregate(searchPipeline).exec();

  const videos = await Video.find(
    {
      $or: [
        { title: { $regex: userQuery, $options: "i" } }, // Case-insensitive regex match
        { description: { $regex: userQuery, $options: "i" } },
      ],
    },
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

  if (!videos || videos.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No videos exist"));
  }

  return res.status(200).json(new ApiResponse(200, videos, "Matches found"));
}, "searchVideo");

export {
  uploadVideo,
  getAllVideo,
  getVideoById,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
  getUserVideoById,
  increaseVideoCount,
  videoPrivacy,
  searchVideo,
};
