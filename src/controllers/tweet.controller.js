import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { content } = req.body;

  if (!id) {
    throw new ApiError(401, "you are not authorized");
  }

  if (!content) {
    throw new ApiError(400, "content is requried");
  }
  const tweet = await Tweet.create({
    content,
    owner: id,
  });

  if (!tweet) {
    throw new ApiError(500, "something wrong try again later");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, tweet, "successfully tweet"));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    throw new ApiError(401, `invalid userId ${id}`);
  }

  console.log("id => ", id);

  // const tweet = await Tweet.find({ owner: id });
  const tweet = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: {
          $project: [
            {
              fullname: 1,
              avatar: 1,
              username: 1,
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likecount",
      },
    },
    {
      $addFields: {
        likecount: {
          $size: $likecount,
        },
      },
    },
    {
      $addFields: {
        owner: {
          $first: $owner,
        },
      },
    },
  ]);

  if (!tweet || !tweet.length === 0) {
    throw new ApiResponse(200, [], "No tweets found for the following user !");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "successfuly fetch all the tweets"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.id;
  const { content } = req.body;

  if (!tweetId || !content) {
    throw new ApiError(401, "All filed are required");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content,
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(500, "Something went wrong please try again later");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.body;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(401, "tweet is requried");
  }
  const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deleteTweet) {
    throw new ApiError(400, "error while deleting tweet!");
  }

  return res.status(200).json(new ApiResponse(200, {}, "tweet is deleted"));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
