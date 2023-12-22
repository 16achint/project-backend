import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("Request headers:", req.headers);
  console.log("Request body at the beginning --> ", req.body);
  console.log("Request files --> ", req.files);
  //1. get user details from frontend
  //2. validation - not empty
  //3. check if user already exists: username, email
  //4. check for images, check for avatar
  //5. upload them to cloudinary, avatar
  //6. create user object - create entry in db
  //7. remove password and refresh token field from response
  //8. check for user creation
  //9. return res

  // 1.
  const { fullName, email, password, username } = req.body;
  console.log("request body --> ", req.body);

  // if (!req.files || Object.keys(req.files).length === 0) {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // 2.
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // if (
  //   [username, fullName, email, password].some(
  //     (field) => field === undefined || field?.trim() === ""
  //   )
  // ) {
  //   throw new ApiError(400, "All field are required !!");
  // }

  // if (
  //   [username, fullName, email, password].some(
  //     (field) => field === undefined || field?.trim() === ""
  //   )
  // ) {
  //   throw new ApiError(400, "All field are required !!");
  // }

  // 3.
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User alreay exists");
  }

  // 4.
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("req ----> ", req.files);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 5.
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // 6.

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // 7.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // 8.
  if (!createdUser) {
    throw new ApiError(500, "Some went wrong while registering the user");
  }

  // 9.

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd successfully"));
});

export { registerUser };