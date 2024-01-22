import { asyncHandler } from "../utils/asyncHandler";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name.trim()) {
    throw new ApiError(401, "name is required");
  }
  if (!description.trim()) {
    throw new ApiError(401, "description is requrired");
  }

  const playlist = await playlist.create({
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

export { createPlaylist };
