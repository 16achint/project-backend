import { Router } from "express";
import {
  getAllVideo,
  getVideoById,
  uploadVideo,
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

export default router;
