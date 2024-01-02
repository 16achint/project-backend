import { Router } from "express";
import {
  getAllVideo,
  getVideoById,
  uploadVideo,
  updateVideoDetails,
  updateThumbnail,
  deleteVideo,
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
router.route("/updateDetails/:id").patch(verifyJWT, updateVideoDetails);
router
  .route("/updateThumbnail/:id")
  .patch(
    verifyJWT,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateThumbnail
  );

router.route("/deleteVideo/:id").delete(verifyJWT, deleteVideo);

export default router;
