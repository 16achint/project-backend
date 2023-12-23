import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  (res, req, next) => {
    next();
  },
  upload,
  registerUser
);

export default router;
