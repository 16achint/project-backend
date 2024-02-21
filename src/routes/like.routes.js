import {
  toggleVideoLike,
  toggleCommentLike,
  toogleTweetLike,
  getLikedVideo,
} from "../controllers/like.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/toogle/v/:videoId").post(toggleVideoLike);
router.route("/toogle/v/:commentId").post(toggleCommentLike);
router.route("/toogle/v/:tweetId").post(toogleTweetLike);
router.route("videos").get(getLikedVideo);

export default router;
