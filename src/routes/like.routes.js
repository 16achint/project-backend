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

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toogleTweetLike);
router.route("/videos").get(getLikedVideo);

export default router;
