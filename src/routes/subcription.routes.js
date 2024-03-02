import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubcription,
  getChannelSubcription,
  getSubcription,
} from "../controllers/subcription.controller.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/c/:channelId")
  .get(getChannelSubcription)
  .post(toggleSubcription);

router.route("/u/:subcriberId").get(getSubcription);

export default router;
