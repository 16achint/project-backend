import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ffmpeg from "fluent-ffmpeg";
import { getVideoDurationInSeconds } from "get-video-duration";
// import ffmpeg from "ffmpeg";

function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const durationInSeconds = metadata.format.duration;
        resolve(durationInSeconds);
      }
    });
  });
}

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
  const calculatedDuration = await getVideoDurationInSeconds(videoLocalPath);

  if (!thumbnailLocalPath) {
    throw new ApiError(401, "thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  console.log("videoFile", videoFile);
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
  console.log(isOploaded);

  if (!isOploaded) {
    throw new ApiError(401, "some thing went wrong while uploading video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video oploaded successfully"));
}, "uploadVideo");

export { uploadVideo };
