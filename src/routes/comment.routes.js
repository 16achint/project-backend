import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addComment, getVideoComment } from "../controllers/comment.controller";

const router = Router();
router.use(verifyJWT);

router.route("/:videoId").get(getVideoComment).post(addComment);
router.route("/").get(getVideoComment);

export default router;
