import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subcription.model.js";
import { User } from "../models/user.models.js";

const toggleSubcription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "channel id is invalid");
  }
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(400, "user is required");
  }

  const credential = { subscriber: userId, channel: channelId };

  const subscribed = await Subscription.findOne(credential);
  if (!subscribed) {
    const newSubscriber = await Subscription.create(credential);

    if (!newSubscriber) {
      throw new ApiError(500, "unable to subscribe the channel");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, newSubscriber, "channel subscribed successfully")
      );
  } else {
    const deleteSubcription = await Subscription.deleteOne(credential);

    if (!deleteSubcription) {
      throw new ApiError(500, "Unable to unsubscribed the channel");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "unsubscribed successfully"));
  }
});

const getChannelSubcription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // ToDo: return subscriber list of a channel
  if (!channelId) {
    throw new ApiError(400, "channel is invaild");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "channel not found");
  }

  const pipeline = [
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribers: 1,
      },
    },
  ];

  const totalSubscriber = await Subscription.aggregate(pipeline);

  if (!toggleSubcription) {
    throw new ApiError(500, "Error finding subscribers");
  }

  console.log(
    "toggleSubcription.length ",
    totalSubscriber.length,
    totalSubscriber
  );
  if (totalSubscriber.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "0 subscribers for this channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        totalSubscriber,
        "All subScriber fetched successfully"
      )
    );
});

const getSubcription = asyncHandler(async (req, res) => {
  const { subcriberId } = req.params;
  // ToDo: return channel list to which user has subscribed

  if (!subcriberId.trim()) {
    throw new ApiError(400, "subscriberId is required");
  }
  const user = await User.findById(subcriberId);

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const pipeline = [
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subcriberId),
      },
    },
    {
      $lookup: {
        from: "users", // remeber every user is also a channel
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribedTo: 1,
      },
    },
  ];

  const subscribedChannel = await Subscription.aggregate(pipeline);

  if (!subscribedChannel) {
    throw new ApiError(500, "error while fetch channels");
  }

  if (subscribedChannel.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "you have not subscribed any channel yet"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannel, "channel fetched successfully")
    );
});

export { toggleSubcription, getChannelSubcription, getSubcription };
