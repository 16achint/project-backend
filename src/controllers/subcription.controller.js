import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subcription.model.js";

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
    const newSubscriber = Subscription.create(credential);

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
});

const getSubcription = asyncHandler(async (req, res) => {
  const { subcriberId } = req.params;
});

export { toggleSubcription, getChannelSubcription, getSubcription };
