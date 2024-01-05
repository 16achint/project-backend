import { Router } from "express";
import {
  getAllVideo,
  getVideoById,
  uploadVideo,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
  getUserVideoById,
  increaseVideoCount,
  videoPrivacy,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/uploadVideo").post(
  verifyJWT,
  (req, res, next) => next(),
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router.route("/").get(getAllVideo);
router.route("/:id").get(getVideoById);
router.route("/:id").put(verifyJWT, updateVideoDetails);
router
  .route("/:id/thumbnail")
  .put(
    verifyJWT,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateThumbnail
  );

router.route("/:id/delete").delete(verifyJWT, deleteVideo);
router.route("/user/:userId").get(getUserVideoById);
router.route("/:id/increase-count").post(increaseVideoCount);
router.route("/:id/toggle-privacy").put(verifyJWT, videoPrivacy);

export default router;
