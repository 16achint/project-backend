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
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(401, `invalid userId ${id}`);
  }

  const ownerPipeline = [
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
      },
    },
    {
      $project: {
        _id: 0,
        username: "$owner.username",
        fullName: "$owner.fullName",
        avatar: "$owner.avatar",
      },
    },
    {
      $unwind: "$username",
    },
    {
      $unwind: "$fullName",
    },
    {
      $unwind: "$avatar",
    },
  ];

  const tweetPipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(id),
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
        likeCount: {
          $size: "$likecount",
        },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        likeCount: 1,
      },
    },
  ];

  const [ownerdetails] = await Tweet.aggregate(ownerPipeline);
  const tweets = await Tweet.aggregate(tweetPipeline);

  if (!ownerdetails) {
    throw new ApiError(404, "user data not found");
  }

  if (!tweets) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          ownerdetails,
          "No tweets found for the following user !"
        )
      );
  }

  const data = {
    ownerdetails,
    tweets,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "successfuly fetch all the tweets"));
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
