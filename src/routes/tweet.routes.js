import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/:id/update-tweet").patch(updateTweet);
router.route("/user/:id").get(getUserTweet);
router.route("/id/delete").delete(deleteTweet);

export default router;
